// ========== API SERVER  ==========
const server1 = `${SERVER_URL}/check1`;
const server2 = `${SERVER_URL}/check2`;
const fastServer1 = `${SERVER_URL}/fastcheck1`;
const fastServer2 = `${SERVER_URL}/fastcheck2`;
let abortController = null;
let chunks = [];
let currentProgress = 0;
let selectedServer;
async function EXECUTE() {
	if (invalidEmails.length > 0) {
		return;
	}
	emailInput.value = validEmails.join('\n');
	const emails = emailInput.value.split('\n').map(email => email.trim()).filter(email => email.length > 0);
	if (emails.length === 0) {
		return;
	}
	const lang = isLanguageID
	  ? {
		  generating: `<p>MEMBUAT KUNCI API</p><p>SILAHKAN TUNGGU...</p>`,
		  error: `KESALAHAN: GAGAL MEMBUAT KUNCI API. SILAKAN COBA LAGI.`,
		  button: `<i class="fas fa-play"></i> EKSEKUSI`,
		  initError: "Gagal menginisialisasi kunci API untuk dieksekusi."
		}
	  : {
		  generating: `<p>GENERATING API KEY</p><p>PLEASE WAIT...</p>`,
		  error: `ERROR: FAILED TO GENERATE API KEY. PLEASE TRY AGAIN.`,
		  button: `<i class="fas fa-play"></i> EXECUTE`,
		  initError: "Failed to initialize API key for execution."
		};


	// === BAGIAN UTAMA ===
	if (!APIKEY) {
	  systemMessage.innerHTML = lang.generating;
	  executeBtn.innerHTML = `<div class="loading-spinner"></div>`;

	  try {
		const getApiKey = await handleGenerateKey();
		APIKEY = getApiKey.APIKEY;
	  } catch (error) {
		unsetExecutionUi();
		systemMessage.textContent = lang.error;
		console.error(lang.initError, error);
		throw new Error(lang.initError);
	  }

	  executeBtn.innerHTML = lang.button;
	}
	setExecutionUi();
	// Get selected server from radio buttons
	selectedServer = document.querySelector('input[name="server"]:checked').value;
	// Set chunk size based on server type
	let chunkSize;
	let server;
	if (selectedServer === 'server1' || selectedServer === 'server2') {
		verifyFilterBtn.classList.remove('hidden');
		unregisteredFilterBtn.classList.remove('hidden');
		disabledFilterBtn.classList.remove('hidden');
		chunkSize = 100;
		if (selectedServer === 'server1') server = server1;
		else server = server2;
	} else {
		verifyFilterBtn.classList.add('hidden');
		unregisteredFilterBtn.classList.add('hidden');
		disabledFilterBtn.classList.add('hidden');
		chunkSize = 10000;
		if (selectedServer === 'fastServer1') server = fastServer1;
		else server = fastServer2;
	}
	chunks = [];
	for (let i = 0; i < emails.length; i += chunkSize) {
		chunks.push(emails.slice(i, i + chunkSize));
	}
	results = [];
	abortController = new AbortController();
	currentProgress = 0;
	updateProgressBar(0);
	isLanguageID? systemMessage.textContent = `MEMPROSES...` : systemMessage.textContent = `PROCESSING...`;
	try {
		await processChunksSingleServer(chunks, server);
		if (abortController.signal.aborted) {
			throw new Error('Aborted by user.');
		}
		await animateProgressBar(currentProgress, 100);
		progressOverlay.classList.add('hidden');
		stopButttonContainer.classList.add('hidden');
		outputButtonContainer.classList.remove('hidden');
		apiStats.classList.remove('hidden');
		closStatsAbsolute.classList.remove('hidden');
		isLanguageID? systemMessage.textContent = "EKSEKUSI SELESAI!" : systemMessage.textContent = "EXECUTION COMPLETED!";
		// SAFETY CHECK - Pastikan saveCurrentResults tersedia
		if (typeof saveCurrentResults === 'function') {
			await saveCurrentResults();
		} else {
			console.warn('saveCurrentResults not available, skipping history save');
			// Fallback: coba inisialisasi history system
			setTimeout(() => {
				if (typeof initHistorySystem === 'function') {
					initHistorySystem().then(() => {
						if (typeof saveCurrentResults === 'function') {
							saveCurrentResults();
						}
					});
				}
			}, 500);
		}
		// SAFETY CHECK - Pastikan updateApiStatsAfterExecution tersedia
		if (typeof updateApiStatsAfterExecution === 'function') {
			await updateApiStatsAfterExecution(results.length);
		} else {
			console.warn('updateApiStatsAfterExecution not available, skipping stats update');
		}
		updateCounters();
		resultListContainer.scrollTop = 0;
		displayResults();
	} catch (error) {
		if (error.name === 'EXECUTION CANCELLED' || error.message === 'Aborted by user.') {
			// User cancelled, no need to show error
		} else {
			console.error('Execution error:', error);
			unsetExecutionUi();
			systemMessage.textContent = `${error.message}`;
		}
	}
}
async function processChunksSingleServer(chunks, server) {
	if (abortController.signal.aborted) return;
	const REQUEST_TIMEOUT = 180000; // 3 minutes
	for (let i = 0; i < chunks.length; i++) {
		if (abortController.signal.aborted) {
			throw new Error('EXECUTION CANCELLED');
		}
		const chunk = chunks[i];
		const targetProgress = (((i + 1) / chunks.length) * 100);
		try {
			const response = await fetchWithTimeout(server, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${APIKEY}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					mail: chunk
				})
			}, REQUEST_TIMEOUT, abortController.signal);
			if (abortController.signal.aborted) {
				throw new Error('EXECUTION CANCELLED');
			}
			if (!response.ok) {
				throw new Error(`Server returned ${response.status}: ${response.statusText}`);
			}
			const data = await response.json();
			processApiResponse(data);
			if (abortController.signal.aborted) {
				throw new Error('EXECUTION CANCELLED');
			}
			updateCounters();
			displayResults();
			await animateProgressBar(currentProgress, targetProgress);
			if (abortController.signal.aborted) {
				throw new Error('EXECUTION CANCELLED');
			}
			systemMessage.textContent = `PROCESSING... ${currentProgress.toFixed(0)}%`;
		} catch (error) {
			if (error.name === 'EXECUTION CANCELLED') {
				throw error;
			}
			console.error(`Error with ${server}:`, error.message);
		}
		if (i < chunks.length - 1) {
			await new Promise(resolve => setTimeout(resolve, 10));
			if (abortController.signal.aborted) {
				throw new Error('EXECUTION CANCELLED');
			}
		}
	}
}
// Fungsi helper untuk fetch dengan timeout
function fetchWithTimeout(url, options, timeout, outerSignal) {
	return new Promise((resolve, reject) => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => {
			controller.abort();
			reject(new Error('Request timeout (3 minutes)'));
		}, timeout);
		// Tambahkan listener untuk sinyal abort eksternal
		if (outerSignal) {
			outerSignal.addEventListener('abort', () => {
				clearTimeout(timeoutId);
				controller.abort();
				reject(new Error('EXECUTION CANCELLED'));
			}, {
				once: true
			});
		}
		options.signal = controller.signal;
		fetch(url, options).then(response => {
			clearTimeout(timeoutId);
			resolve(response);
		}).catch(error => {
			clearTimeout(timeoutId);
			reject(error);
		});
	});
}

function processApiResponse(data) {
	if (abortController && abortController.signal.aborted) return;
	if (!Array.isArray(data)) {
		console.error('Invalid API response:', data);
		return;
	}
	const isNormalServer = selectedServer === 'server1' || selectedServer === 'server2';
	data.forEach(item => {
		let normalizedStatus = item.status.toLowerCase();
		if (isNormalServer) {
			// Mapping untuk server normal
			const statusMap = {
				'bad': 'bad',
				'error': 'bad',
				'disabled': 'disabled',
				'live': 'live',
				'verify': 'verify',
				'unregistered': 'unregistered'
			};
			normalizedStatus = statusMap[normalizedStatus] || 'error';
		} else {
			// Mapping untuk fast server - semua non-live jadi bad
			normalizedStatus = normalizedStatus === 'live' ? 'live' : 'bad';
		}
		results.push({
			email: item.email,
			status: normalizedStatus,
			details: item.details || 'Validated'
		});
	});
}

// Fungsi untuk membatalkan eksekusi
function cancelExecution() {
	if (abortController) {
		abortController.abort();
		unsetExecutionUi();
		isLanguageID? systemMessage.textContent = "EKSEKUSI DIBATALKAN" : systemMessage.textContent = "EXECUTION CANCELLED";
	}
}
// Fungsi untuk mengupdate tampilan progress bar
function updateProgressBar(percentage) {
	const clampedPercentage = Math.min(100, Math.max(0, percentage)); // Pastikan antara 0-100
	donutChart.style.background = `conic-gradient(#cc0000 ${clampedPercentage}%, #333 ${clampedPercentage}% 100%)`;
	progressText.textContent = `${clampedPercentage.toFixed(0)}%`;
}
// Fungsi baru untuk menganimasikan progress bar
async function animateProgressBar(start, end) {
	const duration = Math.abs(end - start) * 10; // 10ms per 1% untuk total 100% = 1 detik. Bisa diatur.
	const startTime = performance.now();
	return new Promise(resolve => {
		function step(currentTime) {
			const elapsedTime = currentTime - startTime;
			const progressRatio = Math.min(1, elapsedTime / duration);
			const animatedValue = start + (end - start) * progressRatio;
			updateProgressBar(animatedValue);
			currentProgress = animatedValue; // Update global progress
			if (progressRatio < 1 && !abortController.signal.aborted) {
				requestAnimationFrame(step);
			} else {
				updateProgressBar(end); // Pastikan berakhir di nilai target
				currentProgress = end;
				resolve();
			}
		}
		requestAnimationFrame(step);
	});
}
// ========== RESET SYSTEM  ==========
function resetSystem() {
	createLoadingAnimation(duration = 'fast');
	liveBackgroundMob.classList.add('hidden');
	liveBackgroundDesk.classList.add('hidden');	
	results = [];
	currentFilter = 'all';
	filterBtns.forEach(btn => {
		btn.classList.remove('active');
		if (btn.dataset.filter === 'all') {
			btn.classList.add('active');
		}
	});
	resultList.innerHTML = '';
	resultList.style.height = 'auto';
	resultListContainer.scrollTop = 0;
	updateCounters();
	updateProgressBar(0);
	inputSection.classList.remove('hidden');
	emailInput.scrollTop = emailInput.scrollHeight;
	serverSelectionContainer.classList.remove('hidden');
	inputButtonContainer.classList.remove('hidden');
	myAccountButton.classList.remove('hidden');
	systemInfoContainer.classList.remove('hidden');
	closStatsAbsolute.classList.add('hidden');
	executeBtn.disabled = false;
	clearInputBtn.disabled = false;
	pasteBtn.disabled = false;
	uploadBtn.disabled = false;
	executeBtn.innerHTML = ``;
	isLanguageID? executeBtn.innerHTML = `<i class="fas fa-play"></i> EKSEKUSI` : executeBtn.innerHTML = `<i class="fas fa-play"></i> EXECUTE`;
	validateInput();
	systemMessage.style.cssText = "";
	isLanguageID? systemMessage.textContent = "SISTEM TELAH DIRESET." : systemMessage.textContent = "SYSTEM HAS BEEN RESET.";
	outputSection.classList.add('hidden');
	outputButtonContainer.classList.add('hidden');
	progressOverlay.classList.add('hidden');
	apiStats.classList.add('hidden');
	blockUpdateMessages(false);
	updateExecutionStatus(false);
}

function backToMain() {
	results = [];
	currentFilter = 'all';
	filterBtns.forEach(btn => {
		btn.classList.remove('active');
		if (btn.dataset.filter === 'all') {
			btn.classList.add('active');
		}
	});
	resultList.innerHTML = '';
	resultList.style.height = 'auto';
	resultListContainer.scrollTop = 0;
	updateCounters();
	inputSection.classList.remove('hidden');
	emailInput.scrollTop = emailInput.scrollHeight;
	serverSelectionContainer.classList.remove('hidden');
	inputButtonContainer.classList.remove('hidden');
	clearInputBtn.classList.remove('hidden');
	clearErrorsBtn.classList.add('hidden');
	resetBtn.classList.remove('hidden');
	backMyAccountBtn.classList.add('hidden');
	validateInput();
	systemMessage.style.cssText = "";
	isLanguageID? systemMessage.textContent = "MENUNGGU PERINTAH..." : systemMessage.textContent = "AWAITING COMMAND...";
	isLanguageID? resultTitle.textContent = "HASIL" : resultTitle.textContent = "RESULTS";
	document.querySelector('main').style.background = "";
	backgroundGlow.style.cssText = "";
	outputSection.classList.add('hidden');
	outputButtonContainer.classList.add('hidden');
	progressOverlay.classList.add('hidden');
	apiStats.classList.add('hidden');
	blockUpdateMessages(false);
	updateExecutionStatus(false);
}

function setExecutionUi() {
	if (isMobile){
		liveBackgroundMob.classList.remove('hidden');
		liveBackgroundDesk.classList.add('hidden');			
	} else{
		liveBackgroundMob.classList.add('hidden');
		liveBackgroundDesk.classList.remove('hidden');
	}
	progressOverlay.classList.remove('hidden');
	stopButttonContainer.classList.remove('hidden');
	executeBtn.disabled = true;
	clearInputBtn.disabled = true;
	pasteBtn.disabled = true;
	uploadBtn.disabled = true;
	systemMessage.style.innerHTML = "";
	systemMessage.style.cssText = "";
	backMyAccountBtn.classList.add('hidden');
	executeBtn.disabled = true;
	serverSelectionContainer.classList.add('hidden');
	myAccountButton.classList.add('hidden');
	errorInfo.classList.add('hidden');
	inputButtonContainer.classList.add('hidden');
	inputSection.classList.add('hidden');
	systemInfoContainer.classList.remove('hidden');
	outputSection.classList.remove('hidden');
	resetBtn.classList.remove('hidden');
	blockUpdateMessages(true);
	updateExecutionStatus(true);
}

function unsetExecutionUi() {
	createLoadingAnimation(duration = 'fast')
	liveBackgroundMob.classList.add('hidden');
	liveBackgroundDesk.classList.add('hidden');	
	results = [];
	currentFilter = 'all';
	filterBtns.forEach(btn => {
		btn.classList.remove('active');
		if (btn.dataset.filter === 'all') {
			btn.classList.add('active');
		}
	});
	resultList.innerHTML = '';
	resultList.style.height = 'auto';
	resultListContainer.scrollTop = 0;
	updateCounters();
	updateProgressBar(0);
	progressOverlay.classList.add('hidden');
	inputSection.classList.remove('hidden');
	inputButtonContainer.classList.remove('hidden');
	serverSelectionContainer.classList.remove('hidden');
	systemInfoContainer.classList.remove('hidden');
	executeBtn.disabled = false;
	clearInputBtn.classList.remove('hidden');
	clearErrorsBtn.classList.add('hidden');
	myAccountButton.classList.remove('hidden');
	systemMessage.style.innerHTML = "";
	systemMessage.style.cssText = "";
	executeBtn.disabled = false;
	clearInputBtn.disabled = false;
	pasteBtn.disabled = false;
	uploadBtn.disabled = false;
	validateInput();
	resetBtn.classList.add('hidden');
	stopButttonContainer.classList.add('hidden');
	outputSection.classList.add('hidden');
	systemInfoContainer.classList.remove('hidden');
	closStatsAbsolute.classList.add('hidden');
	blockUpdateMessages(false);
	updateExecutionStatus(false);
}