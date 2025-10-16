			// ========== HISTORY SYSTEM WITH INDEXEDDB ==========
			const DB_NAME = 'GmailCheckerHistory';
			const DB_VERSION = 1;
			const STORE_NAME = 'checkHistory';
			let db = null;
			// Initialize IndexedDB
			async function initDB() {
			    return new Promise((resolve, reject) => {
			        const request = indexedDB.open(DB_NAME, DB_VERSION);
			        request.onerror = () => reject(request.error);
			        request.onsuccess = () => {
			            db = request.result;
			            resolve(db);
			        };
			        request.onupgradeneeded = (event) => {
			            const database = event.target.result;
			            if (!database.objectStoreNames.contains(STORE_NAME)) {
			                const store = database.createObjectStore(STORE_NAME, {
			                    keyPath: 'id',
			                    autoIncrement: true
			                });
			                store.createIndex('timestamp', 'timestamp', {
			                    unique: false
			                });
			                store.createIndex('filename', 'filename', {
			                    unique: false
			                });
			            }
			        };
			    });
			}
			// Generate filename based on email count and date
			function generateFilename(emailCount) {
			    const now = new Date();
			    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '-');
			    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
			    return `History-${emailCount}emails-BulkGmailChecker_${dateStr}_${timeStr}`;
			}
			// Save check results to IndexedDB
			async function saveCheckHistory(results, serverInfo) {
			    if (!db) await initDB();
			    try {
			        const transaction = db.transaction([STORE_NAME], 'readwrite');
			        const store = transaction.objectStore(STORE_NAME);
			        const historyItem = {
			            timestamp: Date.now(),
			            filename: generateFilename(results.length),
			            emailCount: results.length,
			            results: results,
			            serverInfo: serverInfo, // Simpan informasi server
			            stats: {
			                live: results.filter(item => item.status === 'live').length,
			                verify: results.filter(item => item.status === 'verify').length,
			                disabled: results.filter(item => item.status === 'disabled').length,
			                unregistered: results.filter(item => item.status === 'unregistered').length,
			                bad: results.filter(item => item.status === 'bad').length
			            }
			        };
			        const request = store.add(historyItem);
			        return new Promise((resolve, reject) => {
			            request.onsuccess = () => resolve(request.result);
			            request.onerror = () => reject(request.error);
			        });
			    } catch (error) {
			        console.error('Error saving history:', error);
			        throw error;
			    }
			}
			// Get all history items
			async function getAllHistory() {
			    if (!db) await initDB();
			    return new Promise((resolve, reject) => {
			        const transaction = db.transaction([STORE_NAME], 'readonly');
			        const store = transaction.objectStore(STORE_NAME);
			        const index = store.index('timestamp');
			        const request = index.openCursor(null, 'prev'); // Get newest first
			        const historyItems = [];
			        request.onsuccess = (event) => {
			            const cursor = event.target.result;
			            if (cursor) {
			                historyItems.push(cursor.value);
			                cursor.continue();
			            } else {
			                resolve(historyItems);
			            }
			        };
			        request.onerror = () => reject(request.error);
			    });
			}
			// Get specific history item by ID
			async function getHistoryItem(id) {
			    if (!db) await initDB();
			    return new Promise((resolve, reject) => {
			        const transaction = db.transaction([STORE_NAME], 'readonly');
			        const store = transaction.objectStore(STORE_NAME);
			        const request = store.get(id);
			        request.onsuccess = () => resolve(request.result);
			        request.onerror = () => reject(request.error);
			    });
			}
			// Delete history item
			async function deleteHistoryItem(id) {
			    if (!db) await initDB();
			    return new Promise((resolve, reject) => {
			        const transaction = db.transaction([STORE_NAME], 'readwrite');
			        const store = transaction.objectStore(STORE_NAME);
			        const request = store.delete(id);
			        request.onsuccess = () => resolve();
			        request.onerror = () => reject(request.error);
			    });
			}
			// Clear all history
			async function clearAllHistory() {
			    if (!db) await initDB();
			    return new Promise((resolve, reject) => {
			        const transaction = db.transaction([STORE_NAME], 'readwrite');
			        const store = transaction.objectStore(STORE_NAME);
			        const request = store.clear();
			        request.onsuccess = () => resolve();
			        request.onerror = () => reject(request.error);
			    });
			}
			// Format date for display
			function formatDate(timestamp) {
			    const date = new Date(timestamp);
			    return date.toLocaleString();
			}
			// Load and display history in modal
			async function loadHistory() {
			    try {
			        // Tunggu sebentar untuk memastikan DOM sudah siap
			        await new Promise(resolve => setTimeout(resolve, 50));
			        const historyList = document.getElementById('history-list');
			        const totalChecksEl = document.getElementById('total-checks');
			        const totalEmailsEl = document.getElementById('total-emails');
			        // Validasi elemen exist
			        if (!historyList || !totalChecksEl || !totalEmailsEl) {
			            console.error('History elements not found in DOM');
			            // Coba buat ulang modal jika elemen tidak ditemukan
			            if (!myAccountModal) {
			                await createMyAccountModal();
			                // Coba lagi setelah modal dibuat ulang
			                return await loadHistory();
			            }
			            return;
			        }
			        historyList.innerHTML = '<p>Loading history...</p>';
			        const historyItems = await getAllHistory();
			        // Update stats
			        totalChecksEl.textContent = `Total: ${historyItems.length}`;
			        const totalEmails = historyItems.reduce((sum, item) => sum + item.emailCount, 0);
			        totalEmailsEl.textContent = `Emails: ${totalEmails}`;
			        if (historyItems.length === 0) {
			            historyList.innerHTML = ` <div class="empty-history"> <i class="fas fa-history fa-2x" style="margin-bottom: 10px;"></i> <p>No check history found</p> <p style="font-size: 0.9em;">Your check results will appear here</p> </div> `;
			            return;
			        }
			        let html = '';
					historyItems.forEach(item => {
						const isNormalServer = item.serverInfo ? item.serverInfo.isNormalServer : true;
						
						let statsHtml = '';
						
						if (isNormalServer) {
							// Tampilkan semua statistik untuk normal server
							statsHtml = ` <span>${item.emailCount} emails | </span> <span class="status-live">Live: ${item.stats.live} | </span> <span class="status-verify">Verify: ${item.stats.verify} | </span> <span class="status-disabled">Disabled: ${item.stats.disabled} | </span> <span class="status-unregistered">Unregistered: ${item.stats.unregistered} | </span> <span class="status-bad">Bad: ${item.stats.bad} | </span> <span style="color: #cccc00; font-style: italic;"> Server: Normal</span> `;
						} else {
							// Hanya tampilkan Live dan Bad untuk fast server
							statsHtml = ` <span>${item.emailCount} emails | </span> <span class="status-live">Live: ${item.stats.live} | </span> <span class="status-bad">Bad: ${item.stats.bad} | </span> <span style="color: #cc9900; font-style: italic;"> Server: Fast</span> `;
						}

						html += ` <div class="history-item" data-id="${item.id}"> <div class="history-info"> <div class="history-filename">${item.filename}</div> <div class="history-meta"> <span>${formatDate(item.timestamp)}</span> ${statsHtml} </div> </div> <div class="history-actions"> <button class="history-btn open" title="Open in results"> <i class="fas fa-folder-open"></i> </button> <button class="history-btn copy" title="Copy results"> <i class="fas fa-copy"></i> </button> <button class="history-btn download" title="Download results"> <i class="fas fa-download"></i> </button> <button class="history-btn delete" title="Delete history"> <i class="fas fa-trash"></i> </button> </div> </div> `;
					});
			        historyList.innerHTML = html;
			        // Add event listeners to history buttons
			        document.querySelectorAll('.history-item').forEach(item => {
			            const id = parseInt(item.dataset.id);
						item.querySelector('.history-filename').addEventListener('click', () => openHistoryItem(id));
						item.querySelector('.history-meta').addEventListener('click', () => openHistoryItem(id));
			            item.querySelector('.history-btn.open').addEventListener('click', () => openHistoryItem(id));
			            item.querySelector('.history-btn.copy').addEventListener('click', (event) => copyHistoryItem(id, event));
			            item.querySelector('.history-btn.download').addEventListener('click', () => downloadHistoryItem(id));
			            item.querySelector('.history-btn.delete').addEventListener('click', () => deleteHistoryItemUI(id));
			        });
			    } catch (error) {
			        console.error('Error loading history:', error);
			        // Fallback: coba tampilkan error di modal jika mungkin
			        const historyList = document.getElementById('history-list');
			        if (historyList) {
			            historyList.innerHTML = '<p class="status-error">Error loading history</p>';
			        }
			    }
			}
			// Open history item in main results
			async function openHistoryItem(id) {
			    try {
			        const historyItem = await getHistoryItem(id);
			        if (!historyItem) {
			            alert('History item not found');
			            return;
			        }
			        // Set the results to the history item results
			        results = historyItem.results;
			        // Atur tampilan tombol filter berdasarkan informasi server
			        if (historyItem.serverInfo) {
			            const isNormalServer = historyItem.serverInfo.isNormalServer;
			            if (isNormalServer) {
			                // Server normal - tampilkan semua tombol filter
			                verifyFilterBtn.classList.remove('hidden');
			                unregisteredFilterBtn.classList.remove('hidden');
			                disabledFilterBtn.classList.remove('hidden');
			            } else {
			                // Fast server - sembunyikan beberapa tombol filter
			                verifyFilterBtn.classList.add('hidden');
			                unregisteredFilterBtn.classList.add('hidden');
			                disabledFilterBtn.classList.add('hidden');
			            }
			        } else {
			            // Fallback untuk history lama tanpa informasi server
			            // Tampilkan semua tombol (default behavior)
			            verifyFilterBtn.classList.remove('hidden');
			            unregisteredFilterBtn.classList.remove('hidden');
			            disabledFilterBtn.classList.remove('hidden');
			        }
			        // Update UI
			        updateCounters();
			        displayResults();
			        // Show output section
			        inputSection.classList.add('hidden');
			        outputSection.classList.remove('hidden');
			        inputButtonContainer.classList.add('hidden');
			        outputButtonContainer.classList.remove('hidden');
			        // Close modal
			        closeMyAccountModal();
			        // Show success message
			        systemMessage.style.innerHTML = "";
			        systemMessage.style.cssText = "";
			        systemMessage.style.color = "yellow";
			        systemMessage.textContent = `${historyItem.filename}`;
			        resultTitle.textContent = "RESULTS HISTORY";
			        backgroundGlow.style.cssText = "background: radial-gradient(circle, rgba(255, 190, 0, 0.2) 0%, rgba(120, 192, 219, 1) 60%, rgba(255, 107, 0, 0.3) 100%);animation: pulseGlow 10s infinite alternate ease-in-out;";
			        document.querySelector('main').style.background = "#665200";
		            resetBtn.classList.add('hidden');
			        backMyAccountBtn.classList.remove('hidden');
					errorInfo.classList.add('hidden');
					serverSelectionContainer.classList.add('hidden');
					blockUpdateMessages(true);					
			    } catch (error) {
			        console.error('Error opening history item:', error);
			        alert('Failed to open history item');
			    }
			}

			// Copy history item results
			async function copyHistoryItem(id, event) { 
				try {
					const historyItem = await getHistoryItem(id);
					if (!historyItem) {
						alert('History item not found');
						return;
					}
					const textToCopy = historyItem.results.map(item => item.email).join('\n');
					await navigator.clipboard.writeText(textToCopy);
					// Show feedback
					const copyBtn = event.target.closest('.history-btn.copy');
					const originalHtml = copyBtn.innerHTML;
					copyBtn.innerHTML = '<i class="fas fa-check"></i>';
					copyBtn.style.backgroundColor = 'rgba(0, 255, 127, 0.4)';
					setTimeout(() => {
						copyBtn.innerHTML = originalHtml;
						copyBtn.style.backgroundColor = '';
					}, 2000);
				} catch (error) {
					console.error('Error copying history item:', error);
					alert('Failed to copy history item');
				}
			}
			// Download history item
			async function downloadHistoryItem(id) {
			    try {
			        const historyItem = await getHistoryItem(id);
			        if (!historyItem) {
			            alert('History item not found');
			            return;
			        }
			        const textToDownload = historyItem.results.map(item => item.email).join('\n');
			        const blob = new Blob([textToDownload], {
			            type: 'text/plain'
			        });
			        const url = URL.createObjectURL(blob);
			        const a = document.createElement('a');
			        a.href = url;
			        a.download = `${historyItem.filename}.txt`;
			        document.body.appendChild(a);
			        a.click();
			        document.body.removeChild(a);
			        URL.revokeObjectURL(url);
			    } catch (error) {
			        console.error('Error downloading history item:', error);
			        alert('Failed to download history item');
			    }
			}
			// Delete history item from UI and database
			async function deleteHistoryItemUI(id) {
			    if (!confirm('Are you sure you want to delete this history item?')) {
			        return;
			    }
			    try {
			        await deleteHistoryItem(id);
			        // Remove from UI
			        const historyItem = document.querySelector(`.history-item[data-id="${id}"]`);
			        if (historyItem) {
			            historyItem.style.opacity = '0.5';
			            setTimeout(() => {
			                historyItem.remove();
			                // Reload history to check if empty
			                loadHistory();
			            }, 300);
			        }
			    } catch (error) {
			        console.error('Error deleting history item:', error);
			        alert('Failed to delete history item');
			    }
			}
			// Clear all history
			async function clearAllHistoryUI() {
			    if (!confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
			        return;
			    }
			    try {
			        await clearAllHistory();
			        await loadHistory(); // Reload empty history
			    } catch (error) {
			        console.error('Error clearing history:', error);
			        alert('Failed to clear history');
			    }
			}
			// Initialize database when app starts
			async function initHistorySystem() {
			    try {
			        await initDB();
			    } catch (error) {
			        console.error('Failed to initialize history system:', error);
			    }
			}
			// Update the save function to be called after execution
			async function saveCurrentResults() {
			    try {
			        if (!results || results.length === 0) {
			            console.warn('No results to save to history');
			            return;
			        }
			        // Pastikan history system sudah diinisialisasi
			        if (!db) {
			            await initHistorySystem();
			        }
			        // Pastikan fungsi saveCheckHistory tersedia
			        if (typeof saveCheckHistory !== 'function') {
			            console.error('saveCheckHistory function not available');
			            return;
			        }
			        // Simpan informasi server yang digunakan
			        const serverInfo = {
			            serverType: selectedServer,
			            isNormalServer: selectedServer === 'server1' || selectedServer === 'server2'
			        };
			        await saveCheckHistory(results, serverInfo);
			    } catch (error) {
			        console.error('Failed to save results to history:', error);
			        // Jangan throw error agar tidak mengganggu flow utama eksekusi
			    }
			}