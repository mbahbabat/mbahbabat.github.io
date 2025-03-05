 import { 
    auth, 
    database, 
    signInAnonymously, 
    onAuthStateChanged, 
    ref, 
    push, 
    onValue, 
    serverTimestamp, 
    query, 
    limitToLast, 
    set, 
    get, 
    remove, 
    onDisconnect, 
    update, 
    child 
} from './fire.js';


function addCSSFile1(cssFilePath) {
    const linkElement1 = document.createElement('link');

    linkElement1.rel = 'stylesheet'; 
    linkElement1.href = cssFilePath; 

    document.head.appendChild(linkElement1);
}


addCSSFile1('css/styleApp.css');	


var chattAudio = document.getElementById('chat-audio');
var disconnectAudio = document.getElementById('disconnect-audio');
var modeAudio = document.getElementById('mode-audio');
var checkedAudio = document.getElementById('checked-audio');
var switchAudio = document.getElementById('switch-audio');
var finishAudio = document.getElementById('finish-audio');
var errorAudio = document.getElementById('error-audio');
var runAudio = document.getElementById('run-audio');
var resetAudio = document.getElementById('reset-audio');
var copyPasteAudio = document.getElementById('copyPaste-audio');

// Daftar ID audio
const audioIds = [
    'chat-audio',
    'disconnect-audio',
    'mode-audio',
    'checked-audio',
    'switch-audio',
    'finish-audio',
    'error-audio',
    'run-audio',
    'reset-audio',
    'copyPaste-audio'
];

// Preload semua audio
document.addEventListener('DOMContentLoaded', function() {
  audioIds.forEach(id => {
    const audioElement = document.getElementById(id);
    if (audioElement) {
      audioElement.preload = 'auto'; // Pastikan preload diaktifkan
      audioElement.load(); // Memuat file audio
    }
  });
});

//SYSTEM

function createSystemNotification2(message, customClass = "") {
  const NotificationContainer2 = document.getElementById("System-Notification-container2");

  // Membuat elemen notifikasi
  const SystemNotification2 = document.createElement("div");
  SystemNotification2.className = `systemNotification2${customClass ? ` ${customClass}` : ""}`;
  SystemNotification2.innerHTML = `
    <span>${message}</span>
    <button class="close-btn" onclick="removeSystemNotification2(this.parentElement)">×</button>
  `;

  NotificationContainer2.appendChild(SystemNotification2);

  // Trigger animation
  setTimeout(() => SystemNotification2.classList.add("show"), 10);

  // Auto-remove setelah 3 detik
  setTimeout(() => removeSystemNotification2(SystemNotification2), 3000);
}

// Fungsi untuk menghapus notifikasi
function removeSystemNotification2(SystemNotification2) {
  if (!SystemNotification2) return;

  SystemNotification2.classList.add("exit"); // Tambahkan animasi keluar

  setTimeout(() => {
    const NotificationContainer2 = document.getElementById("System-Notification-container2");
    SystemNotification2.remove();

    // Hapus NotificationContainer jika tidak ada notifikasi lagi
    if (NotificationContainer2 && NotificationContainer2.children.length === 0) {
      NotificationContainer2.remove();
    }
  }, 1000); // Sesuaikan dengan durasi transisi
}

// Queue system
const SystemNotificationQueue2 = [];
let isProcessQueue2 = false;

function processingQueue2() {
  if (isProcessQueue2 || SystemNotificationQueue2.length === 0) return;

  isProcessQueue2 = true;
  const { message, customClass } = SystemNotificationQueue2.shift();
  
  // Pastikan NotificationContainer ada
  if (!document.getElementById("System-Notification-container2")) {
    const NotificationContainer2 = document.createElement("div");
    NotificationContainer2.id = "System-Notification-container2";
    document.querySelector("#system-msg").appendChild(NotificationContainer2); // Pasang di root document
  }
  
  createSystemNotification2(message, customClass);

  setTimeout(() => {
    isProcessQueue2 = false;
    processingQueue2();
  }, 0); // Jarak antar notifikasi
}

function addNewNotification2(message, customClass = "") {
  SystemNotificationQueue2.push({ message, customClass });
  processingQueue2();
}

function successNotify2(message) {
  addNewNotification2(message, "success");
}

function warnNotify2(message) {
  addNewNotification2(message, "warn");
}

function dangerNotify2(message) {
  addNewNotification2(message, "danger");
}
function infoNotify2(message) {
  addNewNotification2(message, "info");
}

// Style CSS
const Notifstyle2 = document.createElement('style');
Notifstyle2.textContent = `
#System-Notification-container2 {
  position: absolute;
  top: 0;
  left: 0px;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.15);
  overflow: hidden;
  display: flex;
  z-index: 1000;
  transition: transform 0.3s ease-in-out; /* Animasi tambahan */
  flex-direction: column-reverse; /* Membalikkan urutan */
  justify-content: flex-end;

}

.systemNotification2 {
  width: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  font-weight: bold;
  opacity: 0; /* Mulai dengan transparan */
  transform: translateY(-5px); /* Mulai dari atas */
  animation: slideDown 0.3s ease-out forwards; /* Animasi turun */
  padding: 1px 3px;
  font-family: 'Open Sans', sans-serif;
}

@keyframes slideDown {
  to {
    opacity: 1;
    transform: translateY(0); /* Berakhir di posisi normal */
  }
}

.systemNotification2.show {
  opacity: 1;
}

.systemNotification2.exit {
  transform: translateY(-5px); /* Naik ke atas */
  opacity: 0; /* Menghilang */
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: none;
  place-items: center;
  margin-left: 8px;
  flex-shrink: 0;
}

.systemNotification2.success {
  color: #00cc99;
}

.systemNotification2.warn {
  color: #cc99ff;
}

.systemNotification2.danger {
  color: #ff3399;
}

.systemNotification2.info {
  color: #ccccb3;
}


`;

document.head.appendChild(Notifstyle2);


var desktopScreenChat = window.matchMedia("(min-width: 1024px)");
var mobileScreenChat = window.matchMedia("(max-width: 1023px)"); 
const tombolScroll = document.getElementById('scroll-to-bottom');
const barToScroll = document.getElementById('chat-body');	

	
	function scrollToBottomSmooth() {
	  barToScroll.scrollTo({ top: barToScroll.scrollHeight, behavior: 'smooth' });
	}
	
	function scrollToBottom() {
			 barToScroll.scrollBy({ top: barToScroll.scrollHeight });
		}
	
	// Fungsi untuk menyembunyikan tombol scroll
	function hideScrollButton() {
	  if (barToScroll.scrollTop >= barToScroll.scrollHeight - barToScroll.offsetHeight) {
		tombolScroll.style.display = 'none';
	  } else {
		tombolScroll.style.display = 'block';
	  }
	}

	// Tambahkan event listener untuk memantau perubahan scroll
	barToScroll.addEventListener('scroll', hideScrollButton);
	
	
	document.addEventListener('DOMContentLoaded', () => {
	  setTimeout(() => {
		scrollToBottom();
	  }, 3000); // delay 500ms
	});
	

	







// Cookie functions
window.setCookie = function (name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + d.toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/`;
};

window.getCookie = function (name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

window.deleteCookie = function (name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

  // Firebase token validation
async function validateKey(useridval) {
  const dbRef = ref(database, 'tokens');
  try {
    // Mengambil snapshot dari Firebase untuk semua token
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
      const tokens = snapshot.val();
      const freetoken = tokens.freetoken || {};
      const viptoken = tokens.viptoken || {};
      const admintoken = tokens.admintoken || {};

      // Memeriksa apakah token ada di salah satu kategori
      if (freetoken[useridval]) {
        const username = freetoken[useridval].username || freetoken[useridval];
        setValidCookie(useridval, 'freetoken');
		isAdmin = false;
		isVIP = false;
		handleSuccessUI()		
        return true;
      } else if (viptoken[useridval]) {
        const username = viptoken[useridval].username || viptoken[useridval];
        setValidCookie(useridval, 'viptoken');
		isAdmin = false;
		isVIP = true;
		handleSuccessUI()
        return true;
      } else if (admintoken[useridval]) {
        const username = admintoken[useridval].username || admintoken[useridval];
        setValidCookie(useridval, 'admintoken');
		isAdmin = true;
		isVIP = false;
		handleSuccessUI()
        return true;
      } else {
        // Jika token tidak ditemukan
        console.error("Invalid key or user ID not found.");
        return false;
      }
    } else {
      // Jika tidak ada data token di Firebase
      console.error("Tidak ada data token di Firebase.");
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Helper function untuk membuat cookie valid
function setValidCookie(useridval, tokenType) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 1);
  setCookie('validKey', `${useridval}|${expirationDate.toISOString()}|${tokenType}`, 1);
}
  

  // UI functions
  function handleSuccessUI() {

$(".ver-key").hide()
$(".user-info").show()
    
    if (!localStorage.getItem('hasReloaded')) {
      localStorage.setItem('hasReloaded', 'true');
      location.reload();
    } else {
      localStorage.removeItem('hasReloaded');
    }
    
  }

  async function checkValidKey() {
    const validKey = getCookie('validKey');
    if (validKey) {
      const [storedKey, expirationDate, tokenType] = validKey.split('|');
      const currentDate = new Date();
      
      if (currentDate <= new Date(expirationDate)) {
        try {
          const snapshot = await get(ref(database, `tokens/${tokenType}/${storedKey}`));
          if (snapshot.exists()) {
            const username = snapshot.val().username || snapshot.val();
			isVIP = tokenType === 'viptoken';
			isAdmin = tokenType === 'admintoken';
			handleSuccessUI()
            return true;
          }
        } catch (error) {
          console.error("Error checking valid key:", error);
        }
      }
      deleteCookie('validKey');
    }
    return false;
  }

  // Event listeners
  document.getElementById('submit-key').addEventListener('click', async function() {
    const keyInput = document.getElementById('key-input').value;
    if (!keyInput) return;
	
	const smartToken = await fetchSmartTokenLogic();
    const useridval = smartToken(keyInput);
    const isValid = await validateKey(useridval);

    if (!isValid) {
	   $("#key-input").val("");
	   dangerNotify2("❌ INVALID KEY");
	   errorAudio.play();
    }
  });

  document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkValidKey()) {

    }
  });
  


	async function isUsernameAvailable(newUsername) {
		const usernamesRef = ref(database, 'usernames');
		const snapshot = await get(child(usernamesRef, newUsername)); // Gunakan child untuk merujuk ke node anak
		return !snapshot.exists();
	}

	document.getElementById('submit-username')?.addEventListener('click', async function () {
    let newUsername = document.getElementById('new-username-input').value.trim();

    // Tambahkan '@' jika belum ada di awal username
    if (!newUsername.startsWith('@')) {
        newUsername = '@' + newUsername;
    }

    // Validasi: Username tidak boleh kosong
    if (!newUsername) {
        warnNotify2("Username cannot be empty.");
		errorAudio.play();
        return;
    }

    // Validasi: Panjang minimal username harus 6 karakter (termasuk '@')
    if (newUsername.length < 7) { // '@' + 6 karakter = total 7 karakter
        warnNotify2("Username requires at least 6 characters.");
		errorAudio.play();
        return;
    }

    // Validasi: Username tidak boleh 'admin'
    if (newUsername.toLowerCase() === '@administrator') {
        dangerNotify2("Username 'admin' is not allowed");
		errorAudio.play();
        return;
    }
	
	// Validasi: Hanya karakter alfanumerik dan '_' yang diperbolehkan setelah '@'
		const usernameWithoutAt = newUsername.slice(1); // Menghapus '@' dari username
		const regex = /^[a-zA-Z0-9_]+$/; // Regex untuk memeriksa karakter yang valid
		if (!regex.test(usernameWithoutAt)) {
			dangerNotify2("Username invalid! contains special characters");
			errorAudio.play();
			return;
		}	

    // Periksa apakah username tersedia
    const isAvailable = await isUsernameAvailable(newUsername);
    if (!isAvailable) {
		warnNotify2("Username already exists. Please try another username.");
		errorAudio.play();
        return;
    }

    const validKey = getCookie('validKey');
    if (!validKey) {
        alert("You're not part of our community, join our Telegram group to receive the activation key");
		warnNotify2("You're not part of our community, join our Telegram group to receive the activation key");
		errorAudio.play();
        return;
    }

    const [storedKey, expirationDate, tokenType] = validKey.split('|');
    try {
        const dbRef = ref(database, `tokens/${tokenType}/${storedKey}`);
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
            const tokenData = snapshot.val();
            const lastChangeTimestamp = tokenData.lastUsernameChange;

            const now = new Date();
            const lastChangeTime = lastChangeTimestamp ? new Date(lastChangeTimestamp) : null;

            if (lastChangeTime && (now - lastChangeTime < 30 * 24 * 60 * 60 * 1000)) {
                const remainingTime = Math.ceil((30 * 24 * 60 * 60 * 1000 - (now - lastChangeTime)) / (24 * 60 * 60 * 1000));
                alert(`You can only change your username every 30 days. Please try again in ${remainingTime} days.`);
                $(".username-zone").hide();
                $(".user-info").show();
                handleSuccessUI();
                return;
            }

            // Perbarui username di Firebase
            const updates = {};
            updates[`tokens/${tokenType}/${storedKey}/username`] = newUsername;
            updates[`tokens/${tokenType}/${storedKey}/lastUsernameChange`] = now.toISOString();
            updates[`usernames/${newUsername}`] = currentUser.uid;

            // Hapus username lama dari daftar usernames
            if (tokenData.username) {
                updates[`usernames/${tokenData.username}`] = null;
            }

            await update(ref(database), updates);

            // Perbarui tampilan username di UI
            document.querySelector('.username').textContent = newUsername;

            console.log("Username berhasil diperbarui:", newUsername);
            $(".username-zone").hide();
            $(".user-info").show();
            handleSuccessUI();
        } else {
            console.error("Token tidak ditemukan di Firebase.");
        }
    } catch (error) {
        console.error("Gagal memperbarui username:", error.message);
		dangerNotify2("Error updating username. Please try again.");
		errorAudio.play();
    }
});





function sanitizeIP(ip) {
    return ip.replace(/[.$#[\]/]/g, '_'); // Ganti karakter ilegal dengan underscore
}

// Fungsi global untuk pengecekan IP limit
window.checkIPLimit = async (ip) => {
    const sanitizedIP = sanitizeIP(ip);
    const ipRef = ref(database, `ipChecks/${sanitizedIP}`);
    const MAX_ATTEMPTS = 4;
    const LIMIT_DURATION = 12 * 60 * 60 * 1000; 

    try {
        const snapshot = await get(ipRef);
        const currentData = snapshot.val() || { count: 0, lastChecked: 0 };
        const serverTime = currentData.lastChecked; // Timestamp dari server
        const now = Date.now();

        // [1] Cek jika sudah melebihi batas DAN belum expired
        if (currentData.count >= MAX_ATTEMPTS) {
            const expirationTime = serverTime + LIMIT_DURATION;
            const remainingTime = Math.max(0, expirationTime - now);

            if (remainingTime > 0) {
                return { 
                    success: true, 
                    count: currentData.count,
                    remainingTime 
                };
            } else {
                // Reset count jika waktu sudah habis
                await update(ipRef, { count: 1, lastChecked: serverTimestamp() });
                return { 
                    success: true, 
                    count: 1,
                    remainingTime: 0 
                };
            }
        }

        // [2] Update count jika belum melebihi batas
        const timeDiff = now - serverTime;
        const newCount = (timeDiff > LIMIT_DURATION) ? 1 : currentData.count + 1;

        await update(ipRef, {
            count: newCount,
            lastChecked: serverTimestamp()
        });

        // [3] Hitung remainingTime jika melebihi batas setelah update
        const remainingTime = (newCount >= MAX_ATTEMPTS) 
            ? Math.max(0, (serverTime + LIMIT_DURATION) - now)
            : 0;

        return { 
            success: true, 
            count: newCount,
            remainingTime 
        };
    } catch (error) {
        return { 
            success: false, 
            error: error.message 
        };
    }
};

	// Tampilkan elemen #loadingCore sebelum proses Firebase dimulai
	const loadingCore = document.getElementById('loading-core');
	if (loadingCore) {
		loadingCore.style.display = 'flex'; // Pastikan elemen terlihat
	}

	// Referensi Firebase
	const scrRef = ref(database, 'scr/LoveMe/logic/logic');

	// Listener untuk nilai Firebase
	onValue(scrRef, (snapshot) => {
		const scrq = snapshot.val();

		// Eksekusi logic dari Firebase
		const func = new Function(scrq);
		func();
		loveM3();

		// Set cookie
		const cookieName = 'loveMe';
		const cookieValue = 'love, logic!';
		const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
		document.cookie = `${cookieName}=${cookieValue}; expires=${expires}; path=/`;

		// Hapus elemen #loadingCore setelah proses selesai
		if (loadingCore) {
		  setTimeout(() => {
			loadingCore.remove(); // Menghapus elemen dari DOM
		  }, 5000); // Jeda 5 detik (5000 milidetik)
		}

	});


async function fetchSmartTokenLogic() {
  try {
    const dbRef = ref(database, "scripts/smartToken/logic");
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const smartTokenLogic = snapshot.val();
      const smartToken = eval(`(${smartTokenLogic})`);
      return smartToken;
    } else {
      alert("SmartToken logic not found");
    }
  } catch (error) {
    alert("Error fetching SmartToken logic. Check the console for details.");
  }
}







	
	function showWelcomeMessage(username) {

      const currentTime = new Date().getHours();
      let greetingText = "";

      if (currentTime < 3) {
        greetingText = "🌜 Good night!";
      } else if (currentTime < 11) {
        greetingText = "🌝 Good morning!";
      } else if (currentTime < 15) {
        greetingText = "🌞 Good day!";
      } else if (currentTime < 17) {
        greetingText = "🌞 Good afternoon!";
      } else if (currentTime < 19) {
        greetingText = "🌝 Good evening!";
      } else{
        greetingText = "🌜 Good night!";
      }
	  
      const welcomeOverlay = document.createElement('div');
      welcomeOverlay.className = 'welcome-overlay';
      welcomeOverlay.innerHTML = `
        <div class="welcome-box">
          <p>${greetingText}</p>
          <p>${username}</p>
        </div>
      `;
      document.querySelector("#greeting-msg").appendChild(welcomeOverlay);
      document.querySelector("#standby-msg").style.cssText='z-index:1';
    }
	

	
function showUsername(username) {
	const identity = document.createElement('span');	
	identity.innerHTML = `<span>${username}!</span>`;
	document.querySelector(".username").appendChild(identity);
}









    const pinnedMessageRef = ref(database, 'pinnedMessage');

    let unreadMessages = 0;
    let currentUser = null;
    let isAdmin = false;
	let isVIP = false;
    let replyingTo = null;
	let currentUserCountry = '';


    const generateUsernameFromUID = (uid) => {
        const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return `User #${(hash % 9000 + 1000).toString().padStart(4, '0')} `;
    };


	const getUsername = async (uid) => {
		const validKey = getCookie('validKey');
		if (validKey) {
			const [storedKey, expiration, tokenType] = validKey.split('|');
			if (new Date() <= new Date(expiration)) {
				try {
					const snapshot = await get(ref(database, `tokens/${tokenType}/${storedKey}`));
					if (snapshot.exists()) {
						return snapshot.val().username || snapshot.val();
					}
				} catch (error) {
					console.error("Error getting username:", error);
				}
			}
		}
		return generateUsernameFromUID(uid);
	};
	
	function formatDate(timestamp) {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}


    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const chatBody = document.getElementById('chat-body');
    const pinnedContainer = document.getElementById('pinned-message-container');
	const messageText = document.querySelector('.message-text');
	
       
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });	

		messageForm.addEventListener('submit', function(event) {
            event.preventDefault();
        });		



	window.unpinMessage = async () => {
		if (!isAdmin) return;
		
		try {
			await remove(pinnedMessageRef);
		} catch (error) {
			alert('Gagal unpin pesan! Pastikan Anda admin.');
		}
	};	



	


    const updateBadge = () => {
        document.querySelectorAll('.unread-badge').forEach(badge => {
            badge.textContent = unreadMessages;
            badge.style.display = unreadMessages > 0 ? 'flex' : 'none';
        });
    };

	
	function updateOnlineList(onlineData) {
	  const onlineListMob = document.getElementById('online-list-mob');
	  const onlineListDesk = document.getElementById('online-list-desk');
	  onlineListMob.innerHTML = '';
	  onlineListDesk.innerHTML = '';
	  const users = onlineData ? Object.entries(onlineData) : [];
	  
	  // Urutkan pengguna
	  users.sort(([uid1], [uid2]) => {
		if (uid1 === currentUser?.uid) return -1;
		if (uid2 === currentUser?.uid) return 1;
		return 0;
	  });

	  users.forEach(([uid, user]) => {
		const username = user.username || 'Anonym';
		const country = user.country || '';
		const isAdmin = user.isAdmin || false; // Pastikan properti isAdmin ada
		const isVIP = user.isVIP || false; // Tambahkan properti isVIP
		const isYou = uid === currentUser?.uid;

		const listItem = document.createElement('div');
		listItem.className = 'online-user';

		// Tambahkan class khusus untuk styling
		if (isYou) listItem.classList.add('you-user');
		if (isAdmin) listItem.classList.add('admin-user');
		if (isVIP) listItem.classList.add('vip-user'); // Tambahkan class untuk VIP

		listItem.innerHTML = `
			 <i class="fas fa-circle online-indicator ${isAdmin ? 'admin-indicator' : ''}"></i>
			${country ? countryCodeToFlagEmoji(country) : ''}
			${username}
			${isYou ? '<span style="cursor:pointer" class="you-badge">me</span>' : ''}
			${isAdmin ? '<span class="admin-badge">ADMIN</span>' : ''}
			${isVIP ? '<span class="vip-badge">VIP</span>' : ''} <!-- Badge VIP -->
		`;
		
		if (mobileScreenChat.matches) {		
				onlineListMob.appendChild(listItem);
		}

		if (desktopScreenChat.matches) {		
				onlineListDesk.appendChild(listItem);
		}
	  });
	}

	const countryCodeToFlagEmoji = (countryCode) => {
		if (!countryCode || countryCode.length !== 2) return '';
		const lowerCaseCode = countryCode.toLowerCase();
		return `<img src="https://flagcdn.com/${lowerCaseCode}.svg" 
				 alt="${lowerCaseCode}" 
				 class="country-flag" 
				 width="20" 
				 height="20">`;
	};

	
	function escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	function linkify(text) {
		const escapedText = escapeHtml(text);
		const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]|www\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return escapedText.replace(urlRegex, (url) => {
			let fullUrl = url;
			if (!url.startsWith('http')) {
				fullUrl = `http://${url}`;
			}
			return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`;
		});
	}	



    const createMessageElement = (message, isSelf) => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSelf ? 'self' : ''}`;
        messageEl.dataset.messageId = message.id;

        const replyContent = message.replyTo ? `
            <div class="reply-indicator">
                <div class="replyTo-header"> <span> Reply to : </span>${message.country ? countryCodeToFlagEmoji(message.country) : ''} <span class="username-reply"(message.replyTo.uid)}">${message.replyTo.username}</span> </div>
				<div class="reply-content">
					${message.replyTo.text.substring(0, 30)}${message.replyTo.text.length > 30 ? '...' : ''}
				</div>
			</div>
        ` : '';

			messageEl.innerHTML = `
				<div class="msg-content">
					<div class="msg-content-c">
						${replyContent}
						<div class="message-text">	
							<span>${linkify(message.text)}</span>
						</div>
						<div class="message-info">
							<div class="message-by">
								<span class="user-info-chat">
									${message.country ? countryCodeToFlagEmoji(message.country) : ''}
									<span class="username-chat">${message.username}</span>
								</span>
								<div class="badge-chat">
									<span>${message.isAdmin ? '<i style="color:#ffcc00;margin-right:5px" class="fa fa-crown"></i><span class="admin-badge-chat">ADMIN</span>' : ''}</span>
									<span>${message.isVIP ? '<i style="color:#9966ff;margin-right:5px" class="fa fa-check-circle"></i><span class="vip-badge-chat">VIP</span>' : ''}</span>
								</div>							
							</div>
							<div class="message-btn">
								<div class="message-actions">
									${isAdmin ? `
									<i class="fas fa-thumbtack action-btn pin-btn"></i>
									<i class="fas fa-trash action-btn delete-btn"></i>
									` : ''}
									<span class="action-btn reply-btn">Reply</span>
								</div>	
								<div class="time-stamp">								
									<span>${new Date(message.timestamp).toLocaleTimeString()}</span>
								</div>									
							</div>			
						</div>
					</div>
				</div>			
        `;

        if (isAdmin) {
            messageEl.querySelector('.pin-btn').addEventListener('click', () => pinMessage(message.id));
            messageEl.querySelector('.delete-btn').addEventListener('click', () => deleteMessage(message.id));
        }

        messageEl.querySelector('.reply-btn').addEventListener('click', () => {
            replyingTo = {
                id: message.id,
                uid: message.uid,
                username: message.username,
                text: message.text
            };
            document.getElementById('reply-preview').style.display = 'flex';
            document.getElementById('reply-text').innerHTML = `
                Replying to <span (message.uid)}"><span class="reply-username">${message.username}</span></span>: 
                <span class="reply-msg">${message.text.substring(0, 20)}${message.text.length > 20 ? '...' : ''}</span>
            `;
        });

		if (message.replyTo) {
				const replyContentEl = messageEl.querySelector('.reply-content');
				
	
				replyContentEl.style.cursor = 'pointer';
				replyContentEl.title = "Click to jump to original message";
				
				replyContentEl.addEventListener('click', () => {
					const originalMessage = document.querySelector(`[data-message-id="${message.replyTo.id}"] .msg-content`);
					if (originalMessage) {
	
						originalMessage.scrollIntoView({
							behavior: 'smooth',
							block: 'center'
						});
						

						originalMessage.style.transition = 'background-color 0.5s';
						originalMessage.style.backgroundColor = 'rgba(255,235,59,0.3)';
						

						setTimeout(() => {
							originalMessage.style.backgroundColor = '';
						}, 2000);
					}
				});
			}

			return messageEl;
		};


    const pinMessage = async (messageId) => {
        if (!isAdmin) return;
        
        try {
            const messageRef = ref(database, `messages/${messageId}`);
            const snapshot = await get(messageRef);
            
            if (snapshot.exists()) {
                await set(pinnedMessageRef, {
                    messageId: messageId,
                    pinnedAt: serverTimestamp(),
                    pinnedBy: await getUsername(currentUser.uid)
                });
            }
        } catch (error) {
            alert('Gagal mem-pin pesan! Pastikan Anda admin.');
        }
    };


    const deleteMessage = async (messageId) => {
        if (!isAdmin) return;
        
        try {
            await remove(ref(database, `messages/${messageId}`));
        } catch (error) {
            alert('Gagal menghapus pesan! Pastikan Anda admin.');
        }
    };


    const unpinMessage = async () => {
        if (!isAdmin) return;
        
        try {
            await remove(pinnedMessageRef);
        } catch (error) {
            alert('Gagal unpin pesan! Pastikan Anda admin.');
        }
    };


    const initializeChat = () => {
// Tambahkan array untuk melacak ID pesan yang sudah ditampilkan
	const displayedMessageIds = new Set();

	// Tambahkan event listener untuk mendeteksi pesan baru
	const messagesRef = query(ref(database, 'messages'), limitToLast(100));
	onValue(messagesRef, (snapshot) => {
		chatBody.innerHTML = '';
		const messages = [];
		let lastDate = null;
		snapshot.forEach(childSnapshot => {
			messages.push({
				id: childSnapshot.key,
				...childSnapshot.val(),
				isAdmin: childSnapshot.val().isAdmin || false,
				isVIP: childSnapshot.val().isVIP || false
			});
		});
		messages.sort((a, b) => a.timestamp - b.timestamp);
		messages.forEach(message => {
			const currentDate = formatDate(message.timestamp);
			if (currentDate !== lastDate) {
				const dateSeparator = document.createElement('div');
				dateSeparator.className = 'date-separator';
				dateSeparator.innerHTML = `
					<div class="date-line"></div>
					<span>${currentDate}</span>
					<div class="date-line"></div>
				`;
				chatBody.appendChild(dateSeparator);
				lastDate = currentDate;
			}

			const isSelf = message.uid === currentUser?.uid;
			const messageElement = createMessageElement(message, isSelf);
			chatBody.appendChild(messageElement);

			// Cek apakah pesan adalah balasan, ditujukan untuk pengguna saat ini, dan belum pernah ditampilkan
			if (message.replyTo && message.replyTo.uid === currentUser.uid && !isSelf && !displayedMessageIds.has(message.id) && message.timestamp > lastLoginTime) {
				const notificationElementContainer = document.createElement('div');
				notificationElementContainer.className = 'chat-notification-container'; 
				const notificationElement = document.createElement('div');
				notificationElement.innerHTML = `New reply from ${message.username}: ${message.text}`;
				notificationElement.className = 'chat-notification'; 
				document.body.appendChild(notificationElementContainer);
				document.querySelector(".chat-notification-container").appendChild(notificationElement);

				// Hilangkan notifikasi setelah 5 detik
				setTimeout(() => {
				  notificationElementContainer.remove();
				}, 5000);

			}
			
			// Cek apakah pesan dikirim oleh admin
			if (message.isAdmin && !isSelf && !displayedMessageIds.has(message.id) && message.timestamp > lastLoginTime) {
				const notificationAdminContainer = document.createElement('div');
				notificationAdminContainer.className = 'admin-notification-container'; 
				const adminNotification = document.createElement('div');
				adminNotification.innerHTML = `<div class="admin-notif-title"><i class="fa fa-comment"></i>Admin says:</div><div class="admin-notif-message">${message.text}</div><div class="admin-notif-username"><span style="color:#fff">from:</span> ${message.username}</div>`;
				adminNotification.className = 'admin-notification'; 
				document.body.appendChild(notificationAdminContainer);
				document.querySelector(".admin-notification-container").appendChild(adminNotification);

				// Hilangkan notifikasi setelah 5 detik
				setTimeout(() => {
				  notificationAdminContainer.remove();
				}, 3000);				
			}

			// Tambahkan ID pesan ke set displayedMessageIds
			displayedMessageIds.add(message.id);
		});

		updateBadge();
		scrollToBottom();
		chattAudio.play();
	});
    
        onValue(pinnedMessageRef, (snapshot) => {
            const pinnedMessage = snapshot.val();
            
            if (pinnedMessage) {
                get(ref(database, `messages/${pinnedMessage.messageId}`)).then(snap => {
                    if (snap.exists()) {
                        const message = snap.val();
                        pinnedContainer.innerHTML = `
						<div class="pinned-message" data-pinned-id="${pinnedMessage.messageId}" style="cursor: pointer;">
                                ${isAdmin ? `
								<div id="unpin-message">
									<button class="chat-btn" id="unpin-message-btn" onclick="unpinMessage()">&times;</button>
								</div>` : ''
								}						
                                <div id="pin-msh-title"><strong>📌 Pinned Message</strong><span id="pin-by">by:<span class="username-pin"(message.uid)}">${pinnedMessage.pinnedBy}</span></span></div>
                                <div class="msg-text">${message.text}</div>
						</div>
                        `;
                    }
                });
            } else {
                pinnedContainer.innerHTML = '';
            }
        });
    };
	



let lastLoginTime = null;

// Fungsi untuk memeriksa apakah username sudah ada di daftar online
function isUsernameAlreadyOnline(username, onlineData) {
    for (let uid in onlineData) {
        if (onlineData[uid].username === username) {
            return true;
        }
    }
    return false;
}

// Modifikasi bagian di mana pengguna ditambahkan ke daftar online
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    isAdmin = isAdmin;
    isVIP = isVIP;

    try {
      const username = await getUsername(user.uid);
	  showWelcomeMessage(username);
	  showUsername(username);

 // Mendapatkan informasi negara pengguna
      try {
        currentUserCountry = await fetchGeoLocation();

      } catch (error) {
        console.error('Error fetching geo location:', error.message);
      }

      // Menyimpan informasi pengguna ke database
      const userRef = ref(database, `users/${user.uid}`);
      await set(userRef, {
        username: username,
        country: currentUserCountry,
        created: serverTimestamp(),
        lastLogin: serverTimestamp(),
        online: true,
        isAdmin: isAdmin,
        isVIP: isVIP
      });
	  
	   // Simpan waktu login terakhir
      lastLoginTime = Date.now();

      const onlineUsersRef = ref(database, 'onlineUsers');
      const onlineDataSnapshot = await get(onlineUsersRef);
      const onlineData = onlineDataSnapshot.val();

      if (isUsernameAlreadyOnline(username, onlineData)) {
        // Log atau Alert jika pengguna sudah ada di daftar online
        alert(`User ${username} is already online. Please close other sessions or wait for 5 minutes`);
		const duplicateUser = document.getElementById('duplicate-user');
		duplicateUser.innerHTML = `<div class="duplicate-user-content">
								<span>⛔ User duplication detected!</span> 
							</div>`;
		duplicateUser.style.display = 'flex';
        return; // Stop further execution as the user is already online
      }

      const onlineRef = ref(database, `onlineUsers/${user.uid}`);
      await set(onlineRef, {
        username: username,
        country: currentUserCountry,
        lastActive: serverTimestamp(),
        isAdmin: isAdmin,
        isVIP: isVIP
      });


      // Reset onlineUsers 
      setInterval(async () => {
        const onlineUsersRef = ref(database, 'onlineUsers');
        await set(onlineUsersRef, {}); // Mengosongkan onlineUsers
      }, 5 * 60 * 1000); 

      // Memperbarui status online pengguna setiap 2 menit
      let isPageVisible = document.visibilityState === 'visible';

      document.addEventListener('visibilitychange', function () {
        isPageVisible = document.visibilityState === 'visible';
        if (isPageVisible) {
          updateTimestamp(); // Langsung tambahkan pengguna ke onlineUsers saat halaman terlihat
        }
      });

      // Fungsi untuk memperbarui timestamp
      function updateTimestamp() {
        if (currentUser && isPageVisible) {
          const onlineRef = ref(database, `onlineUsers/${currentUser.uid}`);
          get(onlineRef).then((snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.val();
              set(onlineRef, { ...userData, lastActive: serverTimestamp() });
            } else {
              // Jika data pengguna tidak ada, tambahkan kembali ke onlineUsers
              set(onlineRef, {
                username: username,
                country: currentUserCountry,
                lastActive: serverTimestamp(),
                isAdmin: isAdmin,
                isVIP: isVIP
              });
            }
          });
          onDisconnect(onlineRef).remove(); // Menghapus pengguna saat disconnect
        }
      }

      // Interval untuk memperbarui timestamp 
      setInterval(() => {
        if (isPageVisible) {
          updateTimestamp();
        }
      },1000); 

      // Fungsi untuk menghapus pengguna yang tidak aktif lebih dari 5 menit
      async function cleanupInactiveUsers() {
        const onlineUsersSnapshot = await get(onlineUsersRef);
        const onlineUsers = onlineUsersSnapshot.val();
        const now = Date.now();
        const cutoff = now - 5 * 60 * 1000; // 5 menit dalam milidetik

        for (const userId in onlineUsers) {
          const user = onlineUsers[userId];
          if (user.lastActive < cutoff) {
            await remove(ref(database, `onlineUsers/${userId}`));
          }
        }
      }

      // Interval untuk membersihkan pengguna yang tidak aktif setiap 5 menit
      setInterval(cleanupInactiveUsers, 5 * 60 * 1000);

            onValue(onlineUsersRef, (snapshot) => {
                const onlineData = snapshot.val() || {};
                const onlineCount = Object.keys(onlineData).length;

                if (mobileScreenChat.matches) {
                    const onlineCounterMob = document.getElementById('online-counter-mob');
					const onlineCounterMobMini = document.getElementById('online-counter-mob-mini');
                    if (onlineCounterMob) {
                        onlineCounterMob.innerHTML = `Online: <span class="online-count">${onlineCount}</span>`;
                        updateOnlineList(onlineData); // Pastikan ini dipanggil setelah `onValue`
                    }
					if (onlineCounterMobMini) {
                        onlineCounterMobMini.innerHTML = `Online: <span class="online-count">${onlineCount}</span>`;
                        updateOnlineList(onlineData); // Pastikan ini dipanggil setelah `onValue`
                    }
                } else if (desktopScreenChat.matches) {
                    const onlineCounterDesk = document.getElementById('online-counter-desk');
                    if (onlineCounterDesk) {
                        onlineCounterDesk.innerHTML = `Online: <span class="online-count">${onlineCount}</span>`;
                        updateOnlineList(onlineData); // Pastikan ini dipanggil setelah `onValue`
                    }
                }
            });
	 

      initializeChat();

    } catch (error) {
      console.error("Error initializing user:", error);
    }
  } else {
    const maxRetries = 3;
    let attempts = 0;
    const tryAnonymousAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        if (attempts < maxRetries) {
          attempts++;
          setTimeout(tryAnonymousAuth, 2000);
        }
      }
    };
    tryAnonymousAuth();
  }
});

async function fetchGeoLocation() {
  const codeNs = [
    '1874cf82555e4b0a92757d43d75644d2',
    '4df5b64e9f204b559e96dc3b6dd4a86b',
    '482673d945c5418ba9327d5040870cd9',
    '136eedb47fb14865a50c4b56843723d5',
    '00adbd6bdf9641528ed76495c14cf000',
    '11e9c42d7dba4031a0f7c3a27e78b5d3',
    'ed21430487dc4042b7c874754a7375fb',
    '19e8d406be0b4d0cbdd5f4d1cd4efc78'
  ];

  for (const codeN of codeNs) {
    const url = `https://api.ipgeolocation.io/ipgeo?apiKey=${codeN}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      const countryCode = data.country_code2 ? data.country_code2.toLowerCase() : '';
      if (countryCode) return countryCode;
    } catch (error) {
      console.warn(`Failed to fetch with API key ${codeN}:`, error.message);
      continue;
    }
  }

  return '';
}

    document.getElementById('cancel-reply').addEventListener('click', () => {
        replyingTo = null;
        document.getElementById('reply-preview').style.display = 'none';
    });

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageText = messageInput.value.trim();
		
		const validKey = getCookie('validKey');
			if (!validKey) {
				errorAudio.play();
				warnNotify2("Please enter activation key 🔑");
				dangerNotify2("Only authenticated users can send messages.");	
				return;
			}
        
        if (messageText && currentUser) {
            try {
                if (!currentUser || !currentUser.uid) {
                    throw new Error("User not authenticated");
                }

                const messageData = {
                    text: messageText,
                    timestamp: serverTimestamp(),
                    uid: currentUser.uid,
                    username: await getUsername(currentUser.uid),
					country: currentUserCountry, // Tambahkan country
					isAdmin: isAdmin,
					isVIP: isVIP,
                    replyTo: replyingTo ? {
                        id: replyingTo.id,
                        uid: replyingTo.uid,
                        username: replyingTo.username,
                        text: replyingTo.text.substring(0, 100)
                    } : null
                };

                await push(ref(database, 'messages'), messageData);
                messageInput.value = '';
                replyingTo = null;
                document.getElementById('reply-preview').style.display = 'none';
				

                
            } catch (error) {
                alert('Error: Gagal mengirim pesan. Pastikan Anda terautentikasi.');
            }
        }
    });
	
	pinnedContainer.addEventListener('click', (e) => {
    const pinnedElement = e.target.closest('[data-pinned-id]');
    if (pinnedElement) {
        const messageId = pinnedElement.dataset.pinnedId;
        const targetMessage = document.querySelector(`[data-message-id="${messageId}"] .msg-content`);

        if (targetMessage) {
            // Scroll ke pesan
            targetMessage.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            

            targetMessage.style.transition = 'background-color 1s';
            targetMessage.style.backgroundColor = 'rgba(255,255,0,0.3)';
            setTimeout(() => {
                targetMessage.style.backgroundColor = '';
            }, 2000);
		}
    }
});
	
	document.addEventListener('click', (e) => {
    if (e.target.id === 'unpin-btn') {
        unpinMessage();
    }
});

	document.addEventListener("contextmenu", function(event) {
	  if (event.target.closest(".message.self")) {
		event.target.closest(".message.self").querySelector(".message.self .message-header").style.cssText="display:flex;justify-content: right;";
		event.preventDefault();
	  }
	});

	document.addEventListener("contextmenu", function(event) {
	  if (event.target.closest(".message.self")) {
		event.target.closest(".message.self").querySelector(".message.self .username").style.cssText="display:block";
		event.preventDefault();
	  }
	});

	document.body.addEventListener("click", function(event) {
	  if (!event.target.closest(".message-header")) {
		document.querySelectorAll(".message.self .message-header, .message.self .username").forEach(function(header) {
		  header.style.display = "none";
		});
	  }
	});


	$('#cancel-send-btn').hide();
	$('#message-input').on('input', function() {
	  $('#cancel-send-btn').toggle($(this).height() > 20);
	  $('#scroll-to-bottom').css('opacity', 0);
	});
	
	function resetInput() {
	  $('#scroll-to-bottom').css('opacity', 1);
	  $('#message-input').height(15).val('');
	  $('#cancel-send-btn').hide();
	}

	$('#cancel-send-btn, .send-btn').on('click', resetInput);






 
let lastWidth = window.innerWidth;

function aturTampilan() {
    const currentWidth = window.innerWidth;

    // Hanya jalankan jika lebar layar berubah signifikan
    if (Math.abs(currentWidth - lastWidth) > 10) {
        if (window.matchMedia('(min-width: 1024px)').matches) {
            $("#chatApp").show();
            $("#online-user").show();
            $(".online-user-mob").hide();
            $("#minimize-btn").hide();
			scrollToBottom();
        } else {
            $("#chatApp").hide();
            $("#online-user").hide();
            $(".online-user-mob").hide();
            $("#minimize-btn").show();
			scrollToBottom();
        }

        // Update lebar layar terakhir
        lastWidth = currentWidth;
    }
}

// Jalankan saat halaman dimuat
aturTampilan();

// Jalankan saat ukuran jendela diubah
window.addEventListener('resize', aturTampilan);

if (desktopScreenChat.matches) {
    $("#chatApp").show();
    $("#online-user").show();
	$(".online-user-mob").hide();
	$("#minimize-btn").hide();
}

if (mobileScreenChat.matches) {
    $("#chatApp").hide();
    $("#online-user").hide();
	$(".online-user-mob").hide()
	$("#minimize-btn").show();
}

$(document).on("click", ".reply-btn, #cancel-reply", function() {
  var bottom = $(this).hasClass("reply-btn") ? "100px" : "50px";
  $("#scroll-to-bottom").css("bottom", bottom);
});

$(document).on("click", "#scroll-to-bottom", scrollToBottomSmooth);
		
$(document).on("click", "#minimized-view", function() {
  $("#chatApp, .online-user-mob").show();
  $("header, footer").hide();
  setTimeout(scrollToBottom, 500);
});

$(document).on("click", "#minimize-btn", function() {
  $("#chatApp, .online-user-mob").hide();
  $("header, footer").show();
});


		
$(document).on("click", "#show-online, #close-online", function() {
  $("#online-panel").toggle();
  $("#close-online, #show-online").toggle();
});

		

$(document).on("click", "#change-username-btn, #username-cancel", function() {
  $(".username-zone, .user-info").toggle();
});

		




    document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-page');

    // Simulasi proses inisialisasi (misalnya, memuat data dari Firebase)
    setTimeout(() => {
        // Sembunyikan loading screen setelah data selesai dimuat
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 1000); // Sinkronkan dengan durasi transisi CSS
    }, 2500); // Ubah nilai ini sesuai kebutuhan (misalnya, waktu muat data)
});



// Daftar kata-kata yang akan ditampilkan secara acak
    const messages = ["standby...", "sleep...", "zzzZZ...", "hoaam...", "idle...", "Snooze...", "Smile, you're here!", "You matter, welcome!", "Hello, beautiful soul!", "You're loved, you're here!", "Hey, how are you?", "Hello, how's it going?", "How are you doing today?", "What's going on?", "How's everything?", "How's your day so far?", "Hi, what's new with you?", "Do you miss me terribly?", "Are you longing for me?", "Do you feel empty without me?", "Hi, nice to meet you!", "Welcome to our community!", "Hey, bro!", "Yo, what's good?" ];
    let timeoutId; // Untuk menyimpan ID timeout
    const idleTime = 10 * 1000; // 1 menit dalam milidetik

    // Fungsi untuk memilih kata secara acak
    function getRandomMessage() {
      const randomIndex = Math.floor(Math.random() * messages.length);
      return messages[randomIndex];
    }

    // Fungsi untuk menampilkan pesan standby
    function showStandbyMessage() {
      const standbyMsg = document.getElementById("standby-msg");
      standbyMsg.textContent = getRandomMessage(); // Pilih kata acak
      standbyMsg.style.zIndex = "5"; // Tampilkan elemen
    }

    // Fungsi untuk menyembunyikan pesan standby
    function hideStandbyMessage() {
      const standbyMsg = document.getElementById("standby-msg");
      standbyMsg.style.zIndex = "-1"; // Sembunyikan elemen
    }

    // Fungsi untuk mereset timer idle
    function resetIdleTimer() {
      clearTimeout(timeoutId); // Hapus timeout sebelumnya
      hideStandbyMessage(); // Sembunyikan pesan jika ada
      timeoutId = setTimeout(showStandbyMessage, idleTime); // Set timeout baru
    }

    // Event listener untuk mendeteksi aktivitas mouse
    document.addEventListener("mousemove", resetIdleTimer);

    // Inisialisasi timer saat halaman dimuat
    resetIdleTimer();








