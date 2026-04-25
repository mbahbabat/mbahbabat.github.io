import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
	apiKey: "AIzaSyDyvwCnhfr2_IIz5m8_OWwskqrcJrFmyqE",
	authDomain: "usa-001-a4193.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// WORKER URL
const WORKER_URL = "https://pawangrecoil-server.mbahbabat.workers.dev";

// Elemen DOM
const loginSection = document.getElementById("login-section");
const setPasswordSection = document.getElementById("set-password-section");
const dashboardSection = document.getElementById("dashboard-section");
const userEmailSpan = document.getElementById("user-email");
const userUsernameSpan = document.getElementById("user-username");
const hwidSpan = document.getElementById("hwid");
const hwid_desk = document.getElementById("hwid_desk");
const messageDiv = document.getElementById("msgbox");
const loadingOverlay = document.getElementById("loading-overlay");
const mainEl = document.getElementById("main-el");
const allModals = document.querySelectorAll('.modal');
const subscribeBtn = document.getElementById('confirm-subscribe-btn');
const cancelsubscribeBtn = document.getElementById('cancel-subscribe-btn');
let loadingSpinner = true;
let globalProfileTimeout = null;
let currentUserProfile = null; // Global state untuk data profil

// ================= CACHE HELPERS =================
const CACHE_KEY = "pawang_profile_data";
const PENDING_PAYMENT_KEY = "pawang_pending_payment";
const CACHE_TTL = 10 * 60 * 1000; // 10 menit TTL untuk profil
const PAYMENT_EXPIRY = 2 * 60 * 60 * 1000; // 2 jam durasi invoice

function getCache() {
	try {
		const data = localStorage.getItem(CACHE_KEY);
		if (!data) return null;
		
		const parsed = JSON.parse(data);
		const now = Date.now();
		
		// Cek apakah cache sudah kadaluarsa (TTL)
		if (parsed.timestamp && (now - parsed.timestamp > CACHE_TTL)) {
			return null;
		}
		
		return parsed.data;
	} catch (e) {
		return null;
	}
}

function setCache(data) {
	try {
		const cacheObj = {
			timestamp: Date.now(),
			data: data
		};
		localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
	} catch (e) {
		console.warn("Failed to save cache:", e);
	}
}

function clearCache() {
	try {
		// Hapus semua key yang berawalan 'pawang_'
		Object.keys(localStorage).forEach(key => {
			if (key.startsWith('pawang_')) {
				localStorage.removeItem(key);
			}
		});
	} catch (e) {
		console.error("Failed to clear cache:", e);
	}
}
// =================================================

function showLoading(show) {
	if(loadingOverlay) loadingOverlay.style.display = show ? "flex" : "none";
}

let isModalHistoryPushed = false;

function mainElDsiplayToggle() {
  const isAnyModalOpen = Array.from(allModals).some(modal => 
    modal.classList.contains('active')
  );

  if (isAnyModalOpen) {
    mainEl.classList.remove('active');
    if (!isModalHistoryPushed) {
      history.pushState({ modal: 'open' }, "");
      isModalHistoryPushed = true;
    }
  } else {
    mainEl.classList.add('active');
    if (isModalHistoryPushed) {
      isModalHistoryPushed = false;
      if (history.state && history.state.modal === 'open') {
        history.back();
      }
    }
  }
}

// Menangani tombol back pada perangkat (Android/iOS)
window.addEventListener('popstate', () => {
  const isAnyModalOpen = Array.from(allModals).some(modal => modal.classList.contains('active'));
  if (isAnyModalOpen) {
    // Tombol back ditekan saat modal terbuka, tutup semua modal
    allModals.forEach(modal => modal.classList.remove('active', 'ticket-expanded-mode'));
    isModalHistoryPushed = false;
    mainEl.classList.add('active');
  }
});

// showMessage function
function showMessage(msg, isError = true) {
	// Tampilkan di div message jika ada
	if(messageDiv) {
		messageDiv.innerHTML = `
			<div class="text-center p-3 rounded-lg font-semibold z-[9999999]  ${isError ? 'bg-red-900/60 text-red-200 border border-red-500' : 'bg-green-900/60 text-green-200 border border-green-400'}">
				<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'} mr-2"></i>
				${msg}
			</div>
		`;
		// Auto hilang setelah 5 detik
		setTimeout(() => {
			if(messageDiv) messageDiv.innerHTML = '';
		}, 2500);
	}
}

async function callAPI(endpoint, method, body = null) {
	if (!auth.currentUser) throw new Error("Session expired. Please login again.");
	const freshToken = await auth.currentUser.getIdToken();
	const res = await fetch(`${WORKER_URL}${endpoint}`, {
		method: method,
		headers: {
			"Authorization": `Bearer ${freshToken}`,
			"Content-Type": "application/json"
		},
		body: body ? JSON.stringify(body) : undefined
	});
	const data = await res.json();		
	if (!res.ok) throw new Error(data.error || "Request failed");
	return data;
}

onAuthStateChanged(auth, async (user) => {
	if (user) {
		try {
			const isPending = localStorage.getItem(PENDING_PAYMENT_KEY) === "true";
			await loadProfile(isPending);
			loginSection.classList.add("hidden");
		} catch (err) {
			showMessage("Failed to load profile: " + err.message);
			loginSection.classList.remove("hidden");
		}
	} else {
		clearCache();
		loginSection.classList.remove("hidden");
		setPasswordSection.classList.add("hidden");
		dashboardSection.classList.add("hidden");
	}
});			

async function loadProfile(forceFetch = false) {
	try {
		let profile = getCache();
		
		// Konsistensi pembersihan pending payment (2 jam sesuai durasi invoice)
		const pendingTime = localStorage.getItem('pawang_pending_time');
		if (pendingTime && Date.now() - parseInt(pendingTime) > PAYMENT_EXPIRY) {
			localStorage.removeItem(PENDING_PAYMENT_KEY);
			localStorage.removeItem('pawang_pending_time');
			localStorage.removeItem('pawang_pending_invoice_url');
		}
		
		// Selalu fetch jika tidak ada cache, atau limit device belum terpenuhi, atau dipaksa
		let needsFetch = forceFetch;
		if (!profile) {
			needsFetch = true;
		} else {
			const maxDevices = (profile.subscriptionEnd > Date.now()) ? 5 : 1;
			const currentDevices = profile.devices ? profile.devices.length : 0;
			if (currentDevices < maxDevices) {
				needsFetch = true;
			}
		}

		if (needsFetch) {
			if(loadingSpinner){
				showLoading(true);
			}
			profile = await callAPI("/profile", "GET", null);
			
			const isWaiting = profile.lastPaymentStatuses === "waiting";
			const isProcessingPayment = profile.isProcessingPayment;
			const isFinished = !isWaiting && !isProcessingPayment;
			
			if (isFinished) {
				localStorage.removeItem(PENDING_PAYMENT_KEY);
				localStorage.removeItem('pawang_pending_time');
				localStorage.removeItem('pawang_pending_invoice_url');
			}
			
			if (profile.activeInvoice && profile.isProcessingPayment) {
				localStorage.setItem(PENDING_PAYMENT_KEY, "true");
				localStorage.setItem('pawang_pending_time', profile.activeInvoice.created_at?.toString() || Date.now().toString());
				localStorage.setItem('pawang_pending_invoice_url', profile.activeInvoice.invoice_url);
			} else {
				// Jangan hapus paksa di sini jika sedang menunggu (isPendingPayment lokal mungkin masih valid)
				// Tapi pastikan jika API bilang tidak ada invoice aktif, kita bersihkan
				if (!profile.activeInvoice && !isProcessingPayment) {
					localStorage.removeItem(PENDING_PAYMENT_KEY);
					localStorage.removeItem('pawang_pending_time');
					localStorage.removeItem('pawang_pending_invoice_url');
				}
			}						
			
			setCache(profile);
			if(loadingSpinner){
				showLoading(false);
			}
		}
		
		renderDashboardUI(profile);
		
	} catch(err) {
		showLoading(false);
		showMessage(err.message);
		throw err; 
	}
}

async function renderDashboardUI(profile) {
	currentUserProfile = profile; // Simpan ke global state
	document.getElementById("display-username").innerText = profile.username || profile.email?.split('@')[0] || "Gamer";
	document.getElementById("display-email").innerText = profile.email;
	const subEnd = profile.subscriptionEnd || 0;
	const hasClaimedTrial = profile.hasClaimedTrial;
	const now = Date.now();
	const vipStatusEl = document.getElementById("vip-status");
	const donationBtn = document.getElementById("buy-vip-btn");
	const pay_with_crypto_text = document.getElementById("pay_with_crypto_text");
	const isWaiting = profile.lastPaymentStatuses === "waiting";
	const isProcessingPayment = profile.isProcessingPayment;
	const isPaymentConfirmed = !isWaiting && isProcessingPayment;
	const isPendingPayment = localStorage.getItem(PENDING_PAYMENT_KEY) === "true";
	const vipTrial = profile.subscriptionType === "trial";
	const vipPaid = profile.subscriptionType === "paid";
	
	if (!profile.hasPassword) {
		setPasswordSection.classList.remove("hidden");
		dashboardSection.classList.add("hidden");
		loginSection.classList.add("hidden");
		userEmailSpan.textContent = profile.email;
		userUsernameSpan.textContent = '@' + profile.username
	} else {
		setPasswordSection.classList.add("hidden");
		dashboardSection.classList.remove("hidden");
		loginSection.classList.add("hidden");
		userEmailSpan.textContent = profile.email;
		userUsernameSpan.textContent = '@' + profile.username;
		const devices = profile.devices || [];
		const maxDevices = (profile.subscriptionEnd > Date.now()) ? 5 : 1;
		const hwid_deskText = devices.length > 0 ? `*Limit: ${devices.length}/${maxDevices} devices. Reset if you change hardware.` : `*Limit: 0/${maxDevices} devices. Automatically linked upon login.`;
		
		let hwidHtml = "";
		if (devices.length === 0) {
			hwidHtml = `
			<div class="flex gap-4 items-center">
				<div class="p-2 flex flex-col gap-2 items-center text-gray-200/75 w-full">
					<i class="fa-solid fa-desktop text-3xl"></i>
					<p class="font-mono font-bold text-sm">No Device Linked</p>
				</div>
			</div>`;
		} else {
			hwidHtml = `<div class="flex flex-col gap-2 max-h-[7.5rem] overflow-y-auto pr-1 stylish-scroll">`;
			devices.forEach((dev, idx) => {
				const pcName = dev.pcName || "Device " + (idx+1);
				const procName = dev.procName || "-";
				const boardName = dev.boardName || "-";
				const osName = dev.osName || "-";
				hwidHtml += `
				<div class="flex gap-3 items-center bg-black/20 p-2 rounded-lg border border-white/5 relative group">
					<div class="p-2 flex flex-col gap-1 items-center text-cyan-400/80 w-50 shrink-0">
						<i class="fa-solid fa-desktop text-xl"></i>
						<p class="font-mono font-bold text-[0.6rem] truncate w-full text-center" title="${pcName}">${pcName}</p>
					</div>
					<div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 w-full overflow-hidden items-center">
						<!-- CPU -->
						<div class="font-mono text-[0.5rem] text-gray-200/50 flex justify-center"><i class="fa-solid fa-microchip w-3"></i></div>
						<div class="font-mono italic text-[0.55rem] text-gray-200/50 truncate" title="${procName}">${procName}</div>
						<!-- MB -->
						<div class="font-mono text-[0.5rem] text-gray-200/50 flex justify-center"><i class="fa-solid fa-memory w-3"></i></div>
						<div class="font-mono italic text-[0.55rem] text-gray-200/50 truncate" title="${boardName}">${boardName}</div>
						<!-- OS -->
						<div class="font-mono text-[0.5rem] text-gray-200/50 flex justify-center"><i class="fa-brands fa-windows w-3"></i></div>
						<div class="font-mono italic text-[0.55rem] text-gray-200/50 truncate" title="${osName}">${osName}</div>
					</div>
				</div>`;
			});
			hwidHtml += `</div>`;
		}
		
		hwidSpan.innerHTML = hwidHtml;
		hwid_desk.innerText = `${hwid_deskText}`;
		
		if (isPendingPayment) {//belum bayar
			if(globalProfileTimeout) clearTimeout(globalProfileTimeout);		
			donationBtn.innerHTML = `<i class="fas fa-rocket text-pink-400"></i> Extend VIP`;
			vipStatusEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Pending Payment...`;
			loadingSpinner = false;
			globalProfileTimeout = setTimeout(async () => {
				await loadProfile(true);
			}, 120000); 
			donationBtn.onclick = (e) => {
				e.preventDefault();
				openSubscriptionModal(); 
			};
			
		} else if (isPaymentConfirmed) {//sudah bayar
			switch(profile.lastPaymentStatuses) {
				case "confirming":
					vipStatusEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Confirming Payment...`;
					break;
				case "confirmed":
					vipStatusEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Payment confirmed! Processing...`;
					break;
				case "sending":
					vipStatusEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing VIP to your account...`;
					break;
				default:
					vipStatusEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing your payment...`;
			}				
			if(globalProfileTimeout) clearTimeout(globalProfileTimeout);

			loadingSpinner = false;
			donationBtn.classList.add('hidden');
			pay_with_crypto_text.classList.add("hidden");
			globalProfileTimeout = setTimeout(async () => {
				await loadProfile(true);
			}, 30000); 
			donationBtn.onclick = (e) => {
				e.preventDefault();
				openSubscriptionModal(); 
			};
			
		} else if (subEnd > now) {//vip aktif
			loadingSpinner = true;
			donationBtn.classList.remove('hidden');
			pay_with_crypto_text.classList.remove("hidden");
			const diff = subEnd - now;    
			let durationText = "Loading..."; 

			if (diff > (1000 * 60 * 60 * 24)) {
				const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
				durationText = `${daysLeft} days remaining`;         
			} else if (diff > (1000 * 60 * 60)) {
				const hoursLeft = Math.ceil(diff / (1000 * 60 * 60));
				durationText = `${hoursLeft} hours remaining`;
			} else {
				const minutesLeft = Math.ceil(diff / (1000 * 60));
				durationText = `${minutesLeft} minutes remaining`;
			}
			const vipText = vipTrial? `<span class="font-gaming font-bold">VIP</span> <span class="text-white text-xs font-thin"> Trial </span>` : `<span class="font-gaming font-bold">VIP</span>`
			vipStatusEl.innerHTML = `<div class="flex flex-col justify-center items-center">
										<p class="text-purple-400"><i class="fa-solid fa-crown"></i> ${vipText}</p>
										<p style="font-family: 'Poppins', sans-serif; font-size:0.7em; color:white; margin-left: 5px; font-thin">${durationText}</p>
									 </div>	
										`;
			donationBtn.innerHTML = `<i class="fas fa-rocket text-pink-400"></i> Extend VIP`;
			donationBtn.onclick = (e) => {
				e.preventDefault();
				openSubscriptionModal(); 
			};                       		
		} else {
			vipStatusEl.innerHTML = `<i class="fa-solid fa-leaf text-green-500"></i> Regular Member`;
			vipStatusEl.style.color="white";
			if (!hasClaimedTrial) {
				donationBtn.innerHTML = `<i class="fas fa-gift shakeAnim text-pink-500"></i> Start Free Trial`;
				donationBtn.onclick = (e) => {
					e.preventDefault();
					openTrialModal();
				};
				pay_with_crypto_text.innerText="( 3 Days FREE )";
			} else {
				donationBtn.innerHTML = `Upgrade to VIP`;
				donationBtn.onclick = (e) => {
					e.preventDefault();
					openSubscriptionModal(); 
				};
				pay_with_crypto_text.classList.remove("hidden");
			}
		}
	}
}

// Login Google
document.getElementById("google-login-btn").addEventListener("click", async () => {
	const btn = document.getElementById("google-login-btn");
	const originalText = btn.innerHTML;				
	try {
		btn.innerHTML = '<i class="fas fa-spinner fa-spin text-xl"></i> LOGGING IN...';
		btn.disabled = true;
		await signInWithPopup(auth, provider);
		showMessage("Login successful!", false);					
	} catch (err) {
		showMessage("Failed to log in: " + err.message);
		btn.innerHTML = originalText;
		btn.disabled = false;
	}
});

// Logout buttons
const handleLogout = () => {
	const btn = document.getElementById("google-login-btn");
	clearCache();
	signOut(auth);
	btn.disabled = false;
	btn.innerHTML = '<i class="fab fa-google text-xl"></i> SIGN IN WITH GOOGLE';
	showMessage("You have been logged out", true);
};
document.getElementById("logout-btn").addEventListener("click", handleLogout);
document.getElementById("logout-btn-dash").addEventListener("click", handleLogout);
		
// Save the first password
document.getElementById("save-password-btn").addEventListener("click", async () => {
	const btn = document.getElementById("save-password-btn");
	const originalText = btn.innerHTML;
	btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Saving...';
	btn.disabled = true;
	try {
		const newPass = document.getElementById("new-password").value;
		const confirmPass = document.getElementById("confirm-password").value;
		if (newPass.length < 4) throw new Error("Password must be at least 4 characters!");
		if (newPass !== confirmPass) throw new Error("Password confirmation does not match!");
		
		await callAPI("/set-password", "POST", { newPassword: newPass });
		
		let cachedData = getCache();
		if(cachedData) {
			cachedData.hasPassword = true;
			setCache(cachedData);
			renderDashboardUI(cachedData);
		} else {
			await loadProfile(true); 
		}

		document.getElementById("new-password").value = "";
		document.getElementById("confirm-password").value = "";
		showMessage("Password saved!", false);
	} catch (err) {
		showMessage(err.message);
	} finally {
		btn.innerHTML = originalText;
		btn.disabled = false;
	}
});

// ========== CHANGE PASSWORD ==========
const changePasswordModal = document.getElementById("change-password-modal");
const cancelPasswordChange = document.getElementById("cancel-password-change");
const closePasswordModal = document.getElementById("close-password-modal");
const confirmPasswordChange = document.getElementById("confirm-password-change");

document.getElementById("change-password-btn").addEventListener("click", () => {
	document.getElementById("modal-new-password").value = "";
	document.getElementById("modal-confirm-password").value = "";
	changePasswordModal.classList.add("active");
	mainElDsiplayToggle()
});

cancelPasswordChange.addEventListener("click", () => {
	changePasswordModal.classList.remove("active");
	mainElDsiplayToggle();
});

closePasswordModal.addEventListener("click", () => {
	changePasswordModal.classList.remove("active");
	mainElDsiplayToggle();
});

confirmPasswordChange.addEventListener("click", async () => {
	const newPass = document.getElementById("modal-new-password").value;
	const confirmPass = document.getElementById("modal-confirm-password").value;
	
	if (newPass.length < 4) {
		showMessage("Password must be at least 4 characters!");
		return;
	}
	if (newPass !== confirmPass) {
		showMessage("Password confirmation does not match!");
		return;
	}
	
	const btn = confirmPasswordChange;
	const originalText = btn.innerHTML;
	btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
	btn.disabled = true;
	
	try {
		await callAPI("/set-password", "POST", { newPassword: newPass });
		showMessage("✨ Password successfully updated! ✨", false);
		changePasswordModal.classList.remove("active");
		mainElDsiplayToggle();
	} catch (err) {
		showMessage(err.message);
	} finally {
		btn.innerHTML = originalText;
		btn.disabled = false;
	}
});

// Close modal when clicking outside
changePasswordModal.addEventListener("click", (e) => {
	if (e.target === changePasswordModal) {
		changePasswordModal.classList.remove("active");
		mainElDsiplayToggle();
	}
});

// ========== RESET HWID ==========
const resetHwidModal = document.getElementById("reset-hwid-modal");
const closeHwidModal = document.getElementById("close-hwid-modal");
const cancelResetHwid = document.getElementById("cancel-reset-hwid");
document.getElementById("reset-hwid-btn").addEventListener("click", () => {
	renderResetHwidModal();
	resetHwidModal.classList.add("active");
	mainElDsiplayToggle();
});

const closeResetModal = () => {
	resetHwidModal.classList.remove("active");
	mainElDsiplayToggle();
}
closeHwidModal.addEventListener("click", closeResetModal);
cancelResetHwid.addEventListener("click", closeResetModal);
resetHwidModal.addEventListener("click", (e) => {
	if (e.target === resetHwidModal) closeResetModal();
});

function renderResetHwidModal() {
	const container = document.getElementById("devices-list-container");
	const profile = getCache();
	const devices = profile?.devices || [];
	
	if (devices.length === 0) {
		container.innerHTML = `
		<div class="bg-black/20 p-4 rounded-xl border border-white/5 text-center text-gray-400 text-sm">
			No devices linked to your account.
		</div>`;
		return;
	}
	
	let html = '';
	devices.forEach((dev, idx) => {
		const pcName = dev.pcName || "Device " + (idx+1);
		const hwid = dev.hwid || "";
		const displayHwid = hwid ? hwid.substring(0,16) + '...' : "Unknown";
		html += `
		<div class="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5 gap-3">
			<div class="flex items-center gap-3 overflow-hidden">
				<div class="bg-cyan-900/30 p-2 rounded-lg text-cyan-400 shrink-0">
					<i class="fa-solid fa-desktop text-xl"></i>
				</div>
				<div class="flex flex-col overflow-hidden">
					<p class="text-white font-bold text-sm truncate w-full" title="${pcName}">${pcName}</p>
					<p class="text-gray-400 text-[0.65rem] truncate font-mono">HWID: ${displayHwid}</p>
				</div>
			</div>
			<button class="unbind-hwid-btn shrink-0 bg-red-600/10 border-y border-red-500/25 hover:border-red-500 hover:text-red-500 text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition" data-hwid="${hwid}">
				<i class="fas fa-unlink"></i> Unbind
			</button>
		</div>`;
	});
	container.innerHTML = html;
	
	container.querySelectorAll('.unbind-hwid-btn').forEach(btn => {
		btn.addEventListener('click', async (e) => {
			const targetHwid = e.currentTarget.getAttribute('data-hwid');
			const originalText = e.currentTarget.innerHTML;
			e.currentTarget.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
			e.currentTarget.disabled = true;
			
			try {
				await callAPI("/reset-hwid", "POST", { hwid: targetHwid });
				showMessage("Device unbound successfully!", false);
				
				let cachedData = getCache();
				if (cachedData && cachedData.devices) {
					cachedData.devices = cachedData.devices.filter(d => d.hwid !== targetHwid);
					setCache(cachedData);
				}
				renderResetHwidModal(); 
			} catch (err) {
				showMessage(err.message || "Failed to unbind device", true);
				e.currentTarget.innerHTML = originalText;
				e.currentTarget.disabled = false;
			}
		});
	});
}

// ========== PAYMENT ==========

// ========== PENDING PAYMENT MODAL ==========
const pendingPaymentModal = document.getElementById("pending-payment-modal");
const closePendingModal = document.getElementById("close-pending-modal");
const cancelPendingBtn = document.getElementById("cancel-pending-btn");
const cancelInvoiceBtn = document.getElementById("cancel-invoice-btn");
const continuePendingBtn = document.getElementById("continue-pending-btn");
let pendingInvoiceUrl = null;

function closePendingModalFunc() {
	if (pendingPaymentModal) {
		pendingPaymentModal.classList.remove("active");
		mainElDsiplayToggle();
	}
}

function openPendingModal(url) {
	pendingInvoiceUrl = url;
	if (pendingPaymentModal) {
		pendingPaymentModal.classList.add("active");
		mainElDsiplayToggle();
	}
}

// Event listeners untuk pending modal
if (closePendingModal) closePendingModal.addEventListener("click", closePendingModalFunc);
if (cancelPendingBtn) cancelPendingBtn.addEventListener("click", closePendingModalFunc);
if (continuePendingBtn) {
	continuePendingBtn.addEventListener("click", () => {
		if (pendingInvoiceUrl) {
			window.open(pendingInvoiceUrl, '_blank');
		}
		closePendingModalFunc();
	});
}
if (cancelInvoiceBtn) {
	cancelInvoiceBtn.addEventListener("click", async () => {
		const btn = cancelInvoiceBtn;
		const originalText = btn.innerHTML;
		btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CANCELLING...';
		btn.disabled = true;
		
		try {
			await callAPI("/cancel-invoice", "POST", null);
			localStorage.removeItem(PENDING_PAYMENT_KEY);
			localStorage.removeItem('pawang_pending_invoice_url');
			localStorage.removeItem('pawang_pending_time');
			
			showMessage("Invoice cancelled successfully!", false);
			closePendingModalFunc();
			
			let cachedData = getCache();
			if (cachedData) {
				cachedData.isProcessingPayment = false;
				cachedData.lastPaymentStatuses = null;
				cachedData.activeInvoice = null;
				setCache(cachedData);
				renderDashboardUI(cachedData);
			} else {
				await loadProfile(true);
			}
		} catch (err) {
			showMessage(err.message || "Failed to cancel invoice");
		} finally {
			btn.innerHTML = originalText;
			btn.disabled = false;
		}
	});
}
if (pendingPaymentModal) {
	pendingPaymentModal.addEventListener("click", (e) => {
		if (e.target === pendingPaymentModal) closePendingModalFunc();
	});
}


// ========== SUBSCRIPTION PACKAGE (PRODUCT TYPE) ==========
let SUBSCRIPTION_PACKAGES = null;
let selectedPackage = null;

const calculateSavings = (packages) => {
	const basePackage = packages["7days"];
	if (!basePackage) return;
	const pricePerDayBase = basePackage.price_usd / 7;

	Object.keys(packages).forEach(key => {
		const pkg = packages[key];
		const days = Math.round(pkg.duration_ms / (24 * 60 * 60 * 1000));

		if (days > 7) {
			const normalPrice = pricePerDayBase * days;
			const nominalSavings = (normalPrice - pkg.price_usd).toFixed(1);
			pkg.savings = `Save $${nominalSavings} USD`;
		} else {
			pkg.savings = null; 
		}
	});
};

async function renderPackages() {
	const container = document.getElementById('package-list');
	if (!container) return;
	
	if (!SUBSCRIPTION_PACKAGES) {
		const cacheKey = "pawang_products_cache";
		const cacheStr = localStorage.getItem(cacheKey);
		if (cacheStr) {
			try {
				const cached = JSON.parse(cacheStr);
				if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
					SUBSCRIPTION_PACKAGES = cached.data;
				}
			} catch(e) {}
		}

		if (!SUBSCRIPTION_PACKAGES) {
			container.innerHTML = '<div class="modal-loading"><i class="fas fa-spinner fa-spin"></i> Loading packages...</div>';
			try {
				const data = await callAPI("/products", "GET", null);
				if (data.products) {
					SUBSCRIPTION_PACKAGES = data.products;
					const icons = {
						"7days": "fa-calendar-week",
						"1month": "fa-calendar-alt",
						"3months": "fa-gem",
						"6months": "fa-crown",
						"1year": "fa-trophy"
					};
					Object.keys(SUBSCRIPTION_PACKAGES).forEach(k => {
						SUBSCRIPTION_PACKAGES[k].icon = icons[k] || "fa-star";
						const days = Math.round(SUBSCRIPTION_PACKAGES[k].duration_ms / (24 * 60 * 60 * 1000));
						SUBSCRIPTION_PACKAGES[k].duration = `${days} Days`;
					});
					calculateSavings(SUBSCRIPTION_PACKAGES);
					
					localStorage.setItem(cacheKey, JSON.stringify({
						timestamp: Date.now(),
						data: SUBSCRIPTION_PACKAGES
					}));
				}
			} catch (err) {
				container.innerHTML = `<div class="text-red-500 text-center p-4">Failed to load packages: ${err.message}</div>`;
				return;
			}
		}
	}
	
	container.innerHTML = '';
	
	Object.entries(SUBSCRIPTION_PACKAGES).forEach(([id, pkg]) => {
		const packageCard = document.createElement('div');
		packageCard.className = 'package-card';
		packageCard.setAttribute('data-package-id', id);
		
		const savingsBadge = pkg.savings ? `<span class="package-badge">${pkg.savings}</span>` : '';
		
		packageCard.innerHTML = `
			${savingsBadge}
			<div class="package-header">
				<div class="package-name">
					<i class="fas ${pkg.icon}"></i> ${pkg.name}
				</div>
				<div class="package-price">
					$${pkg.price_usd}
					<small>USD</small>
				</div>
			</div>
			<div class="package-duration">
				<i class="fas fa-hourglass-half"></i>
				${pkg.duration}
				<span class="package-savings">${pkg.savings ? pkg.savings : '&nbsp;'}</span>
			</div>
			<div class="text-gray-400 text-xs mt-2">
				<i class="fas fa-info-circle"></i> ${pkg.description}
			</div>
			<div id="selected-indicator-${id}" class="selected-check" style="display: none;">
				<i class="fas fa-check-circle"></i> Selected
			</div>
		`;
		
		packageCard.addEventListener('click', () => {
			document.querySelectorAll('.package-card').forEach(card => card.classList.remove('selected'));
			Object.keys(SUBSCRIPTION_PACKAGES).forEach(pkgId => {
				const indicator = document.getElementById(`selected-indicator-${pkgId}`);
				if (indicator) indicator.style.display = 'none';
			});
			
			packageCard.classList.add('selected');
			const indicator = document.getElementById(`selected-indicator-${id}`);
			if (indicator) indicator.style.display = 'block';
			
			selectedPackage = { id, ...pkg };

			if (subscribeBtn) {
				subscribeBtn.disabled = false;
				subscribeBtn.innerHTML = `<i class="fas fa-rocket"></i> PAY $${pkg.price_usd} USD WITH CRYPTO`;
			}
		});
		
		container.appendChild(packageCard);
	});
}

async function openSubscriptionModal() {        
	const pendingUrl = localStorage.getItem('pawang_pending_invoice_url');
	const pendingTime = localStorage.getItem('pawang_pending_time');
	
	if (pendingUrl && pendingTime) {
		const elapsed = Date.now() - parseInt(pendingTime);
		if (elapsed < PAYMENT_EXPIRY) { 
			openPendingModal(pendingUrl);
			return;
		} else {
			localStorage.removeItem(PENDING_PAYMENT_KEY);
			localStorage.removeItem('pawang_pending_invoice_url');
			localStorage.removeItem('pawang_pending_time');
		}
	}
	
	// Lanjut ke pembuatan invoice baru
	const modal = document.getElementById('subscription-modal');
	if (modal) {
		await renderPackages();
		modal.classList.add('active');
		mainElDsiplayToggle();
		selectedPackage = null;
		if (subscribeBtn) {
			subscribeBtn.disabled = true;
			subscribeBtn.innerHTML = '<i class="fas fa-rocket"></i> CONTINUE TO PAYMENT';
		}
	}
}


function closeSubscriptionModal() {
	const modal = document.getElementById('subscription-modal');
	if (modal) {
		modal.classList.remove('active');
		mainElDsiplayToggle();
	}
}

async function handleSubscribe() {
	if (!selectedPackage) return showMessage("Please select a package first!");
	
	const originalText = subscribeBtn.innerHTML;
	subscribeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Invoice...';
	subscribeBtn.disabled = true;
	
	try {
		const data = await callAPI("/create-invoice", "POST", { 
			productId: selectedPackage.id
		});
		
		if (data.invoice_url) {
			localStorage.setItem(PENDING_PAYMENT_KEY, "true");
			localStorage.setItem('pawang_pending_time', Date.now().toString());
			localStorage.setItem('pawang_pending_invoice_url', data.invoice_url);			
			window.open(data.invoice_url, '_blank');
			closeSubscriptionModal();
			let profile = getCache();
			renderDashboardUI(profile);
			subscribeBtn.disabled = false;
		} else {
			throw new Error("No invoice URL received");
		}
		
	} catch (err) {
		localStorage.removeItem(PENDING_PAYMENT_KEY);
		showMessage(err.message || "Failed to create invoice");
		subscribeBtn.innerHTML = originalText;
		subscribeBtn.disabled = false;
	}
}


// Event listener modal subscription
document.getElementById("close-modal-btn")?.addEventListener("click", closeSubscriptionModal);
cancelsubscribeBtn?.addEventListener("click", closeSubscriptionModal);
subscribeBtn?.addEventListener("click", handleSubscribe);
window.addEventListener("click", (e) => {
	if (e.target === document.getElementById("subscription-modal")) closeSubscriptionModal();
});
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape") {
		closeSubscriptionModal();
		changePasswordModal.classList.remove("active");
		resetHwidModal.classList.remove("active");
		mainElDsiplayToggle();
	}
});

// ========== TRIAL VIP MODAL ==========
const trialModal = document.getElementById("trial-modal");
const closeTrialModal = document.getElementById("close-trial-modal");
const cancelTrialBtn = document.getElementById("cancel-trial-btn");
const confirmTrialBtn = document.getElementById("confirm-trial-btn");

function openTrialModal() {
	if (trialModal) {
		trialModal.classList.add("active");
		mainElDsiplayToggle();
	}
}

function closeTrialModalFunc() {
	if (trialModal) {
		trialModal.classList.remove("active");
		mainElDsiplayToggle();
	}
}

// Close trial modal events
if (closeTrialModal) closeTrialModal.addEventListener("click", closeTrialModalFunc);
if (cancelTrialBtn) cancelTrialBtn.addEventListener("click", closeTrialModalFunc);
if (trialModal) {
	trialModal.addEventListener("click", (e) => {
		if (e.target === trialModal) closeTrialModalFunc();
	});
}

// Confirm Trial Activation
if (confirmTrialBtn) {
	confirmTrialBtn.addEventListener("click", async () => {
		const btn = confirmTrialBtn;
		const originalText = btn.innerHTML;
		btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ACTIVATING...';
		btn.disabled = true;
		
		try {
			const data = await callAPI("/claim-trial", "POST", {});
			loadProfile(true);
			if (data.success) {
				showMessage("VIP Activated! You have 3 days of VIP access!", false);
				closeTrialModalFunc();
				
				// Update cache dengan data baru
				let cachedData = getCache();
				if (cachedData) {
					cachedData.hasClaimedTrial = true;
					cachedData.subscriptionEnd = data.subscriptionEnd;
					setCache(cachedData);
					renderDashboardUI(cachedData);
				} else {
					await loadProfile(true);
				}
			} else {
				throw new Error(data.error || "Failed to activate trial");
			}
		} catch (err) {
			if (err.message.includes("TRIAL_ALREADY_CLAIMED")) {
				showMessage("You have already claimed your free trial!", true);
				// Update cache agar tombol berubah
				let cachedData = getCache();
				if (cachedData) {
					cachedData.hasClaimedTrial = true;
					setCache(cachedData);
					renderDashboardUI(cachedData);
				} else {
					await loadProfile(true);
				}
			} else {
				showMessage("Failed to activate trial: " + err.message, true);
			}
			closeTrialModalFunc();
		} finally {
			btn.innerHTML = originalText;
			btn.disabled = false;
		}
	});
}

// Escape key untuk trial modal
const originalEscapeHandler = (e) => {
	if (e.key === "Escape") {
		closeSubscriptionModal();
		changePasswordModal.classList.remove("active");
		resetHwidModal.classList.remove("active");
		closeTrialModalFunc();
		mainElDsiplayToggle();
	}
};
document.removeEventListener("keydown", originalEscapeHandler);
document.addEventListener("keydown", originalEscapeHandler);			

// ========== TICKET SUPPORT SYSTEM (OPTIMIZED) ==========
const TICKET_WORKER_URL = "https://pawangrecoil-tickets.mbahbabat.workers.dev";
const ticketModal = document.getElementById("ticket-modal");
const closeTicketModal = document.getElementById("close-ticket-modal");
const ticketForm = document.getElementById("ticket-form");
const ticketImages = document.getElementById("ticket-images");
const imagePreviewContainer = document.getElementById("image-preview-container");
const imageCountSpan = document.getElementById("image-count");
const tabTickets = document.getElementById("tab-tickets");
const tabCreate = document.getElementById("tab-create");
const ticketsTab = document.getElementById("tickets-tab");
const createTab = document.getElementById("create-tab");
const ticketListContainer = document.getElementById("ticket-list-container");
const refreshTicketsBtn = document.getElementById("refresh-tickets");

// Image modal untuk fullscreen
const imageViewModal = document.createElement("div");
imageViewModal.className = "image-view-modal";

// Custom Dropdown Logic
const customTicketTypeBtn = document.getElementById("custom-ticket-type-btn");
const ticketTypeList = document.getElementById("ticket-type-list");
const ticketTypeInput = document.getElementById("ticket-type");
const selectedTicketTypeText = document.getElementById("selected-ticket-type-text");
const ticketTypeChevron = document.getElementById("ticket-type-chevron");

if (customTicketTypeBtn) {
	customTicketTypeBtn.addEventListener("click", () => {
		ticketTypeList.classList.toggle("hidden");
		ticketTypeChevron.style.transform = ticketTypeList.classList.contains("hidden") ? "rotate(0deg)" : "rotate(180deg)";
	});

	ticketTypeList.addEventListener("click", (e) => {
		const li = e.target.closest("li");
		if (li) {
			const value = li.getAttribute("data-value");
			const text = li.innerHTML;
			ticketTypeInput.value = value;
			selectedTicketTypeText.innerHTML = text;
			ticketTypeList.classList.add("hidden");
			ticketTypeChevron.style.transform = "rotate(0deg)";
		}
	});

	document.addEventListener("click", (e) => {
		if (!customTicketTypeBtn.contains(e.target) && !ticketTypeList.contains(e.target)) {
			ticketTypeList.classList.add("hidden");
			ticketTypeChevron.style.transform = "rotate(0deg)";
		}
	});
}
imageViewModal.innerHTML = '<img id="fullscreen-image" src="" alt="Fullscreen">';
document.body.appendChild(imageViewModal);
imageViewModal.addEventListener("click", () => imageViewModal.classList.remove("active"));

// Store untuk gambar reply per ticket (akan direset saat refresh)
const replyImageStore = {};

// Variabel untuk menyimpan file gambar create ticket
let selectedCreateFiles = [];

// === Utility Functions ===
function formatTicketTime(timestamp) {
	const diff = Date.now() - timestamp;
	const days = Math.floor(diff / 86400000);
	if (days > 0) return `${days}d ago`;
	const hours = Math.floor(diff / 3600000);
	if (hours > 0) return `${hours}h ago`;
	const mins = Math.floor(diff / 60000);
	return mins > 0 ? `${mins}m ago` : "Just now";
}

function formatFullTime(timestamp) {
	return new Date(timestamp).toLocaleString('en-US', {
		month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
	});
}

function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text || '';
	return div.innerHTML;
}

function validateImageFiles(files) {
	if (files.length > 5) {
		showMessage("Maximum 5 images allowed!", true);
		return false;
	}
	for (const file of files) {
		if (file.size > 10 * 1024 * 1024) {
			showMessage("Each image must be less than 10MB!", true);
			return false;
		}
	}
	return true;
}

// === UI Update untuk Create Ticket ===
function updateCreateImagePreview() {
	imagePreviewContainer.innerHTML = "";
	selectedCreateFiles.forEach((file, index) => {
		const reader = new FileReader();
		reader.onload = e => {
			const div = document.createElement("div");
			div.className = "preview-image";
			div.innerHTML = `
				<img src="${e.target.result}" alt="Preview">
				<div class="remove-image" data-index="${index}">
					<i class="fas fa-times"></i>
				</div>
			`;
			div.querySelector(".remove-image").addEventListener("click", () => {
				selectedCreateFiles.splice(index, 1);
				updateCreateImagePreview();
				ticketImages.value = "";
				imageCountSpan.textContent = selectedCreateFiles.length ? `${selectedCreateFiles.length} file(s)` : "No files selected";
			});
			imagePreviewContainer.appendChild(div);
		};
		reader.onerror = () => showMessage("Failed to read image file", true);
		reader.readAsDataURL(file);
	});
	imageCountSpan.textContent = selectedCreateFiles.length ? `${selectedCreateFiles.length} file(s)` : "No files selected";
}

function resetCreateTicketForm() {
	ticketForm.reset();
	selectedCreateFiles = [];
	updateCreateImagePreview();
	const submitBtn = document.getElementById("submit-ticket-btn");
	submitBtn.disabled = false;
	submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> SUBMIT TICKET';
	submitBtn.classList.remove("btn-loading");
}

// === Fungsi Render Tiket (dengan DocumentFragment) ===
async function fetchAndDisplayTickets() {
	const user = auth.currentUser;
	if (!user) return;

	// Reset reply image store saat refresh
	for (const key in replyImageStore) delete replyImageStore[key];

	ticketListContainer.innerHTML = `<div class="empty-tickets"><i class="fas fa-spinner fa-spin"></i><p>Loading tickets...</p></div>`;

	try {
		const token = await user.getIdToken();
		const username = currentUserProfile?.username || user.email.split('@')[0];
		const res = await fetch(`${TICKET_WORKER_URL}/ticket/list?username=${encodeURIComponent(username)}`, {
			headers: { "Authorization": `Bearer ${token}` }
		});
		if (!res.ok) throw new Error("Failed to fetch tickets");
		const tickets = await res.json();
		ticketModal.classList.remove("ticket-expanded-mode"); 
		renderTicketList(tickets);
	} catch (err) {
		console.error(err);
		ticketListContainer.innerHTML = `
			<div class="empty-tickets">
				<i class="fas fa-exclamation-triangle"></i>
				<p>Failed to load tickets: ${err.message}</p>
				<button onclick="location.reload()" class="btn-cyber text-sm px-3 py-1 rounded-lg mt-2">
					<i class="fas fa-sync-alt"></i> Retry
				</button>
			</div>
		`;
	}
}

function renderTicketList(tickets) {
	// Cek apakah ada tiket pending
	const hasPending = tickets.some(t => t.status === 'pending');
	const tabCreateBtn = document.getElementById("tab-create");
	if (tabCreateBtn) {
		if (hasPending) {
			tabCreateBtn.classList.add("opacity-50", "cursor-not-allowed");
			tabCreateBtn.title = "You already have an active ticket";
			// Jika user sedang di tab create, pindahkan ke list
			if (createTab.style.display !== "none") tabTickets.click();
		} else {
			tabCreateBtn.classList.remove("opacity-50", "cursor-not-allowed");
			tabCreateBtn.title = "";
		}
	}

	const fragment = document.createDocumentFragment();
	const container = ticketListContainer;
	container.innerHTML = "";

	if (!tickets || tickets.length === 0) {
		container.innerHTML = `
			<div class="empty-tickets">
				<i class="fas fa-ticket-alt"></i>
				<p>No tickets</p>
				<p class="text-xs text-gray-500 mt-1">Click "NEW TICKET" to create one</p>
			</div>
		`;
		return;
	}

	// Pesan peringatan pending (jika ada)
	if (hasPending) {
		const pendingInfo = document.createElement("div");
		pendingInfo.id = "pending_info";
		pendingInfo.className = "bg-yellow-900/30 border border-yellow-500 p-3 mb-4 rounded-lg text-xs";
		pendingInfo.innerHTML = `<i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
			<span class="text-yellow-200">You still have an open ticket. Please wait for support to respond before creating a new one.</span>`;
		fragment.appendChild(pendingInfo);
	}

	tickets.sort((a, b) => b.createdAt - a.createdAt).forEach(ticket => {
		const hasAdminReplied = ticket.replies && Object.values(ticket.replies).some(r => 
			r.sender === 'Admin' || r.senderType === 'admin'
		);
		const isResolved = ticket.status === 'resolved';
		const showReplyForm = hasAdminReplied && !isResolved;

		const ticketDiv = document.createElement("div");
		ticketDiv.className = "ticket-item mb-3 mini";
		ticketDiv.dataset.ticketId = ticket.ticketId;

		// Ticket Header
		const header = document.createElement("div");
		header.className = "ticket-header";
		header.setAttribute("data-ticket-id", ticket.ticketId);
		header.innerHTML = `
			<div class="flex flex-col gap-1 flex-1">
				<div class="flex items-center gap-2 flex-wrap">
					<span class="font-gaming text-sm text-cyan-300">#${ticket.ticketId}</span>
					<span class="ticket-badge text-gray-400 text-xs"><i class="fas fa-tag"></i> ${ticket.type}</span>
					<span class="ticket-status status-${ticket.status}">
						<i class="fas ${ticket.status === 'pending' ? 'fa-clock' : (ticket.status === 'resolved' ? 'fa-check-circle' : 'fa-clock')}"></i>
						${ticket.status.toUpperCase().replace("PENDING", "OPEN")}
					</span>
				</div>
				<div class="text-xs text-gray-400"><i class="far fa-calendar-alt"></i> ${formatTicketTime(ticket.createdAt)}</div>
			</div>
			<div class="text-cyan-400"><i class="fas fa-chevron-down" id="chevron-${ticket.ticketId}"></i></div>
		`;
		ticketDiv.appendChild(header);

		// Detail Container
		const detailDiv = document.createElement("div");
		detailDiv.id = `detail-${ticket.ticketId}`;
		detailDiv.className = "ticket-detail";

		// Problem Details
		const problemDiv = document.createElement("div");
		problemDiv.id = "problem_details";
		problemDiv.className = "mb-5 text-xs";
		let problemHtml = `<h3 class="font-gaming mb-2 text-cyan-400 text-[0.85rem] font-bold tracking-wider flex items-center gap-2"><i class="fas fa-file-alt"></i> Problem Details</h3>
			<div class="bg-[#050b14]/80 p-4 rounded-xl border border-cyan-900/50 text-gray-300 text-sm min-h-[100px] whitespace-pre-wrap break-words shadow-inner">${escapeHtml(ticket.message)}</div>`;
		if (ticket.images?.length) {
			problemHtml += `<h3 class="font-gaming mb-2 mt-4 text-cyan-400 text-[0.85rem] font-bold tracking-wider flex items-center gap-2"><i class="fas fa-paperclip"></i> Attachments</h3><div class="ticket-images">`;
			ticket.images.forEach(img => {
				problemHtml += `<div class="ticket-image border border-cyan-800/50 rounded-lg overflow-hidden hover:border-cyan-400 transition cursor-pointer"><img src="${img}" alt="Attachment" onclick="window.viewFullImage('${img}')" class="w-full h-full object-cover"></div>`;
			});
			problemHtml += `</div>`;
		}
		problemDiv.innerHTML = problemHtml;
		detailDiv.appendChild(problemDiv);

		// Replies Container
		const repliesContainer = document.createElement("div");
		repliesContainer.className = "replies-container";
		repliesContainer.innerHTML = renderReplies(ticket.replies);
		detailDiv.appendChild(repliesContainer);
		
		// Reply Form
		const formDiv = document.createElement("div");
		const resolvedMsg = document.createElement("div");
		if (showReplyForm) {	
			formDiv.id = `reply-form-${ticket.ticketId}`;
			formDiv.className = "reply-form mt-4 pt-4 border-t border-cyan-800/30 hidden";
			formDiv.innerHTML = `
				<textarea id="reply-msg-${ticket.ticketId}" class="input-modal rounded-xl w-full text-sm mb-3 bg-[#050b14]/80 border-cyan-900/50" rows="3" placeholder="Type your reply here..."></textarea>
				<div id="reply-preview-${ticket.ticketId}" class="image-preview-container flex flex-wrap gap-2 mb-3"></div>
				<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
					<div class="flex items-center gap-3">
						<label class="bg-cyan-900/20 border border-cyan-800/50 hover:bg-cyan-800/40 text-cyan-300 text-xs py-2 px-4 rounded-xl cursor-pointer inline-flex items-center gap-2 transition">
							<i class="fas fa-paperclip"></i> Attach Image
							<input type="file" id="reply-files-${ticket.ticketId}" multiple accept="image/*" class="hidden" data-ticket-id="${ticket.ticketId}">
						</label>
						<span id="reply-image-count-${ticket.ticketId}" class="text-gray-500 text-xs font-mono">No files</span>
					</div>
					<div class="w-full sm:w-auto">
						<button type="button" class="send-reply-btn bg-cyan-600/10 font-gaming border-y border-cyan-300/25 hover:border-cyan-300 hover:text-cyan-300 py-2 px-6 rounded-xl text-cyan-300/80 text-xs font-bold w-full sm:w-auto flex items-center justify-center gap-2 transition" data-ticket-id="${ticket.ticketId}">
							<i class="fas fa-paper-plane"></i> SEND REPLY
						</button>
					</div>
				</div>
				<div id="reply-progress-${ticket.ticketId}" class="upload-progress" style="display: none; margin-top: 10px;">
					<div class="progress-bar"><div class="progress-fill"></div></div>
					<p class="text-xs text-cyan-400 mt-1 text-center font-mono">Sending...</p>
				</div>
			`;
		} else if (isResolved) {
			resolvedMsg.id = `reply-form-${ticket.ticketId}`;
			resolvedMsg.className = "reply-form text-center text-gray-500 text-sm p-3 mt-2 border-t border-gray-700 hidden";
			resolvedMsg.innerHTML = `<i class="fas fa-lock"></i> Ticket closed.`;
		}

		ticketDiv.appendChild(detailDiv);
		showReplyForm? ticketDiv.appendChild(formDiv) : ticketDiv.appendChild(resolvedMsg);
		fragment.appendChild(ticketDiv);
	});

	container.appendChild(fragment);

	// Perbarui preview gambar reply jika ada data di store
	Object.keys(replyImageStore).forEach(ticketId => updateReplyImagePreview(ticketId));
}

function renderReplies(replies) {
	if (!replies || Object.keys(replies).length === 0) {
		return `<div class="text-center text-gray-500 text-sm p-3">
			<i class="fa-solid fa-envelope-circle-check"></i> Your ticket has been processed. Support will contact you soon.
		</div>`;
	}
	const repliesArray = Object.values(replies).sort((a, b) => a.createdAt - b.createdAt);
	return repliesArray.map(reply => `
		<div class="reply-item ${reply.sender === 'Admin' || reply.senderType === 'admin' ? 'admin' : ''}">
			<div class="reply-sender ${reply.sender === 'Admin' || reply.senderType === 'admin' ? 'admin' : 'user'}">
				<i style="font-size:1.5em; color: ${reply.sender === 'Admin' || reply.senderType === 'admin'? '#ff5050' : 'cyan'}" class="${reply.sender === 'Admin' || reply.senderType === 'admin' ? 'fa-solid fa-headset' : 'fa-solid fa-circle-user'}"></i>
				${reply.sender === 'Admin' || reply.senderType === 'admin' ? 'SUPPORT' : reply.sender}
			</div>
			<div class="reply-message">${escapeHtml(reply.message || '')}</div>
			${reply.images?.length ? `
				<h3 class="font-gaming mb-2 mt-4 text-cyan-400 text-[0.85rem] font-bold tracking-wider flex items-center gap-2"><i class="fas fa-paperclip"></i> Attachments</h3>
				<div class="ticket-images mt-2">
					${reply.images.map(img => `<div class="ticket-image border border-cyan-800/50 rounded-lg overflow-hidden hover:border-cyan-400 transition cursor-pointer"><img src="${img}" onclick="window.viewFullImage('${img}')" class="w-full h-full object-cover"></div>`).join('')}
				</div>
			` : ''}
			<div class="reply-time"><i class="far fa-clock"></i> ${formatFullTime(reply.createdAt)}</div>
		</div>
	`).join('');
}

// === Fungsi untuk Reply Images (Preview & Store) ===
function updateReplyImagePreview(ticketId) {
	const previewContainer = document.getElementById(`reply-preview-${ticketId}`);
	const countSpan = document.getElementById(`reply-image-count-${ticketId}`);
	const files = replyImageStore[ticketId] || [];
	if (!previewContainer) return;

	previewContainer.innerHTML = "";
	if (files.length === 0) {
		if (countSpan) countSpan.textContent = "No files";
		return;
	}
	if (countSpan) countSpan.textContent = `${files.length} file(s)`;

	files.forEach((file, index) => {
		const reader = new FileReader();
		reader.onload = e => {
			const div = document.createElement("div");
			div.className = "preview-image";
			div.innerHTML = `
				<img src="${e.target.result}" alt="Preview">
				<div class="remove-image" data-ticket-id="${ticketId}" data-index="${index}">
					<i class="fas fa-times"></i>
				</div>
			`;
			div.querySelector(".remove-image").addEventListener("click", () => {
				replyImageStore[ticketId].splice(index, 1);
				updateReplyImagePreview(ticketId);
				document.getElementById(`reply-files-${ticketId}`).value = "";
			});
			previewContainer.appendChild(div);
		};
		reader.readAsDataURL(file);
	});
}

function addReplyImages(ticketId, newFiles) {
	if (!validateImageFiles(newFiles)) return;
	if (!replyImageStore[ticketId]) replyImageStore[ticketId] = [];
	if (replyImageStore[ticketId].length + newFiles.length > 5) {
		showMessage("Maximum 5 images allowed!", true);
		return;
	}
	replyImageStore[ticketId].push(...newFiles);
	updateReplyImagePreview(ticketId);
}

// === Event Delegation untuk Ticket List ===
ticketListContainer.addEventListener("click", async (e) => {
	// Toggle detail
	const header = e.target.closest(".ticket-header");
	if (header) {
		const ticketId = header.dataset.ticketId;
		const replyform = document.getElementById(`reply-form-${ticketId}`);
		const detail = document.getElementById(`detail-${ticketId}`);
		const chevron = document.getElementById(`chevron-${ticketId}`);
		const allTickets = document.querySelectorAll(".ticket-item");
		const pendingInfo = document.getElementById("pending_info");

		if (detail.classList.contains("active")) {
			detail.classList.remove("active");
			ticketModal.classList.remove("ticket-expanded-mode"); 
			if (chevron) chevron.className = "fas fa-chevron-down";
			if (chevron) chevron.style.cssText = "";
			if (chevron) chevron.style.color = "cyan";
			allTickets.forEach(t => {
				t.classList.remove("hidden");
				t.classList.add("mini");
			});
			if (replyform) replyform.classList.add("hidden");						
		} else {
			detail.classList.add("active");
			ticketModal.classList.add("ticket-expanded-mode"); 
			if (chevron) chevron.className = "fa-regular fa-circle-xmark";
			if (chevron) chevron.style.cssText = "color: #ff3366; font-size:1.5em";
			allTickets.forEach(t => {
				if (t.dataset.ticketId !== ticketId) t.classList.add("hidden");
				else {
					t.classList.remove("hidden");
					t.classList.remove("mini");
				}
			});
			if (replyform) replyform.classList.remove("hidden");
		}
		return;
	}

	// Clear reply images
	const clearBtn = e.target.closest(".clear-reply-btn");
	if (clearBtn) {
		const ticketId = clearBtn.dataset.ticketId;
		delete replyImageStore[ticketId];
		updateReplyImagePreview(ticketId);
		document.getElementById(`reply-files-${ticketId}`).value = "";
		return;
	}

	// Send reply
	const sendBtn = e.target.closest(".send-reply-btn");
	if (sendBtn) {
		const ticketId = sendBtn.dataset.ticketId;
		await sendReplyWithImages(ticketId);
		return;
	}

	// View full image (delegated from ticket-image)
	const imgDiv = e.target.closest(".ticket-image");
	if (imgDiv) {
		const img = imgDiv.querySelector("img");
		if (img) window.viewFullImage(img.src);
	}
});

// Paste image pada modal ticket
ticketModal.addEventListener("paste", (e) => {
	const textarea = e.target.closest("textarea");
	const isReply = textarea && textarea.id?.startsWith("reply-msg-");
	const isCreate = e.target.id === "ticket-message" || e.target.closest("#create-tab");
	
	const items = (e.clipboardData || window.clipboardData).items;
	const files = [];
	for (const item of items) {
		if (item.type.startsWith("image/")) {
			const file = item.getAsFile();
			if (file) files.push(file);
		}
	}
	
	if (files.length) {
		e.preventDefault();
		if (isReply) {
			const ticketId = textarea.id.replace("reply-msg-", "");
			addReplyImages(ticketId, files);
		} else if (isCreate || createTab.style.display !== "none") {
			if (!validateImageFiles(files)) return;
			if (selectedCreateFiles.length + files.length > 5) {
				return showMessage("Maximum 5 images allowed!", true);
			}
			selectedCreateFiles.push(...files);
			updateCreateImagePreview();
		}
	}
});

// File input change untuk reply
ticketListContainer.addEventListener("change", (e) => {
	const input = e.target;
	if (input.type === "file" && input.id?.startsWith("reply-files-")) {
		const ticketId = input.dataset.ticketId;
		const files = Array.from(input.files);
		if (files.length) addReplyImages(ticketId, files);
		input.value = ""; // reset agar bisa memilih file yang sama lagi
	}
});

// Fungsi kirim reply (dipanggil via event delegation)
async function sendReplyWithImages(ticketId) {
	const textarea = document.getElementById(`reply-msg-${ticketId}`);
	const message = textarea.value.trim();
	const images = replyImageStore[ticketId] || [];
	if (!message && images.length === 0) {
		showMessage("Please enter a message or attach an image!", true);
		return;
	}

	const user = auth.currentUser;
	if (!user) return;

	const sendBtn = document.querySelector(`.send-reply-btn[data-ticket-id="${ticketId}"]`);
	const progressDiv = document.getElementById(`reply-progress-${ticketId}`);
	const progressFill = progressDiv?.querySelector(".progress-fill");

	if (sendBtn) {
		sendBtn.disabled = true;
		sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
	}
	if (progressDiv) progressDiv.style.display = "block";

	try {
		const token = await user.getIdToken();
		const formData = new FormData();
		formData.append("ticketId", ticketId);
		formData.append("message", message);
		formData.append("email", user.email);
		images.forEach(file => formData.append("images", file));

		if (progressFill) progressFill.style.width = "50%";
		const res = await fetch(`${TICKET_WORKER_URL}/ticket/reply`, {
			method: "POST",
			headers: { "Authorization": `Bearer ${token}` },
			body: formData
		});
		if (progressFill) progressFill.style.width = "100%";
		const result = await res.json();
		if (!res.ok) throw new Error(result.error || "Failed to send reply");

		showMessage("✅ Reply sent successfully!", false);
		textarea.value = "";
		delete replyImageStore[ticketId];
		updateReplyImagePreview(ticketId);
		// Refresh daftar tiket setelah 1 detik
		setTimeout(() => fetchAndDisplayTickets(), 1000);
	} catch (err) {
		showMessage("Failed to send reply: " + err.message, true);
	} finally {
		if (sendBtn) {
			sendBtn.disabled = false;
			sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
		}
		if (progressDiv) {
			setTimeout(() => {
				progressDiv.style.display = "none";
				if (progressFill) progressFill.style.width = "0%";
			}, 1000);
		}
	}
}

// === Submit Create Ticket ===
ticketForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	const type = document.getElementById("ticket-type").value;
	const message = document.getElementById("ticket-message").value.trim();
	const user = auth.currentUser;
	if (!user) return showMessage("You must be logged in!", true);
	if (!message) return showMessage("Please enter your message!", true);

	const submitBtn = document.getElementById("submit-ticket-btn");
	submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SUBMITTING...';
	submitBtn.disabled = true;

	try {
		const token = await user.getIdToken();
		const username = currentUserProfile?.username || user.email.split('@')[0];
		const formData = new FormData();
		formData.append("email", user.email);
		formData.append("username", username);
		formData.append("type", type);
		formData.append("message", message);
		selectedCreateFiles.forEach(f => formData.append("images", f));

		const res = await fetch(`${TICKET_WORKER_URL}/ticket/create`, {
			method: "POST",
			headers: { "Authorization": `Bearer ${token}` },
			body: formData
		});
		const result = await res.json();
		if (!res.ok) throw new Error(result.error || "Failed to create ticket");

		showMessage(`✅ Ticket ${result.ticket.ticketId} created!`, false);
		resetCreateTicketForm();
		tabTickets.click();
		fetchAndDisplayTickets();
	} catch (err) {
		showMessage("Failed to create ticket: " + err.message, true);
		submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> SUBMIT TICKET';
		submitBtn.disabled = false;
	}
});

// Image selection untuk create ticket
ticketImages.addEventListener("change", (e) => {
	const files = Array.from(e.target.files);
	if (!validateImageFiles(files)) {
		ticketImages.value = "";
		return;
	}
	if (selectedCreateFiles.length + files.length > 5) {
		showMessage("Maximum 5 images allowed!", true);
		ticketImages.value = "";
		return;
	}
	selectedCreateFiles.push(...files);
	updateCreateImagePreview();
	ticketImages.value = ""; // reset
});

// === Global Functions (tetap diperlukan untuk view full image) ===
window.viewFullImage = (url) => {
	document.getElementById("fullscreen-image").src = url;
	imageViewModal.classList.add("active");
};

// === Inisialisasi Modal & Tab ===
document.getElementById("ticket").addEventListener("click", (e) => {
	e.preventDefault();
	ticketModal.classList.add("active");
	mainElDsiplayToggle();
	tabTickets.click();
});

closeTicketModal.addEventListener("click", () => {
	ticketModal.classList.remove("active", "ticket-expanded-mode"); // Pastikan expanded mode mati saat tutup
	mainElDsiplayToggle();
	resetCreateTicketForm();
	// Bersihkan memori reply images
	for (const key in replyImageStore) delete replyImageStore[key];
});

tabTickets.addEventListener("click", () => {
	tabTickets.classList.add("active");
	tabCreate.classList.remove("active");
	ticketsTab.style.display = "flex";
	createTab.style.display = "none";
	fetchAndDisplayTickets();
	resetCreateTicketForm();
});

tabCreate.addEventListener("click", () => {
	const hasPending = Array.from(document.querySelectorAll('.ticket-status')).some(s => s.classList.contains('status-pending'));
	if (hasPending) {
		showMessage("You already have an active ticket!", true);
		return;
	}
	tabCreate.classList.add("active");
	tabTickets.classList.remove("active");
	ticketsTab.style.display = "none";
	createTab.style.display = "flex";
	resetCreateTicketForm();
});

refreshTicketsBtn.addEventListener("click", () => {
	fetchAndDisplayTickets();
	showMessage("Refreshing tickets...", false);
});


// LED Border Animation 
let ledIndex = 0;
let ledInterval = null;
let isHovering = false;
const dashboard = document.querySelector('#dashboard-section');
const destopDashboard = document.querySelector('body[data-rds-mode="desktop"] #dashboard-section'); 

// Mapping class selector ke class active yang sesuai
const colorMapping = [
	{ selector: '.anred', activeClass: 'led-active-red' },
	{ selector: '.anpurple', activeClass: 'led-active-purple' },
    { selector: '.ancyan', activeClass: 'led-active-cyan' },
	{ selector: '.angreen', activeClass: 'led-active-green' },
	{ selector: '.anyellow', activeClass: 'led-active-yellow' },
    { selector: '.anblue', activeClass: 'led-active-blue' }
];

function startLEDAnimation() {
    if (!dashboard) return;
    
    // Kumpulkan semua elemen berdasarkan selector dan mapping warnanya
    let allElements = [];
    
    colorMapping.forEach(map => {
        const elements = [...dashboard.querySelectorAll(map.selector)];
        elements.forEach(el => {
            allElements.push({
                element: el,
                activeClass: map.activeClass
            });
        });
    });
    
    if (allElements.length === 0) return;
    
    // Hentikan animasi sebelumnya
    if (ledInterval) {
        clearInterval(ledInterval);
        ledInterval = null;
    }
    
    ledIndex = 0;
    
    function animate() {
        if (isHovering) return;
        
        // Hapus semua class active dari semua elemen
        allElements.forEach(item => {
            item.element.classList.remove('led-active-cyan', 'led-active-red', 'led-active-purple', 'led-active-green', 'led-active-yellow', 'led-active-blue' );
        });
        
        // Tambahkan class active sesuai warnanya ke elemen saat ini
        if (allElements[ledIndex]) {
            const current = allElements[ledIndex];
            current.element.classList.add(current.activeClass);
        }
        
        // Pindah ke elemen berikutnya
        ledIndex = (ledIndex + 1) % allElements.length;
    }
    
    function stopLEDAnimation() {
        if (ledInterval) {
            clearInterval(ledInterval);
            ledInterval = null;
        }
        // Hapus semua class active
        allElements.forEach(item => {
            item.element.classList.remove('led-active-cyan', 'led-active-red', 'led-active-purple', 'led-active-green', 'led-active-yellow', 'led-active-blue' );
        });
    }
    
    // Jalankan animasi
    if (!isHovering) {
        animate();
        ledInterval = setInterval(animate, 50);
    }
    
    // Event listener hover (hapus dulu yang lama biar ga double)
    destopDashboard.removeEventListener('mouseenter', handleMouseEnter);
    destopDashboard.removeEventListener('mouseleave', handleMouseLeave);
    
    function handleMouseEnter() {
        isHovering = true;
        stopLEDAnimation();
    }
    
    function handleMouseLeave() {
        isHovering = false;
        animate();
        ledInterval = setInterval(animate, 50);
    }
    
    destopDashboard.addEventListener('mouseenter', handleMouseEnter);
    destopDashboard.addEventListener('mouseleave', handleMouseLeave);
}

function observeDashboard() {
    if (!dashboard) return;
    
    const observer = new MutationObserver(() => {
        if (!dashboard.classList.contains('hidden')) {
            startLEDAnimation();
        } else {
            if (ledInterval) {
                clearInterval(ledInterval);
                ledInterval = null;
            }
        }
    });
    
    observer.observe(dashboard, { attributes: true });
    
    if (!dashboard.classList.contains('hidden')) {
        startLEDAnimation();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeDashboard);
} else {
    observeDashboard();
}
