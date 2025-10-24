				(function() {
			'use strict';
			
			// Konfigurasi
			const CONFIG = {
				// Ubah nilai default dan min/max ke rem
				defaultWidthRem: 20, // 300px / 16px (default font size) = 18.75rem, dibulatkan ke 20 untuk contoh
				defaultHeightRem: 12.5, // 200px / 16px = 12.5rem
				minWidthRem: 9.375, // 150px / 16px = 9.375rem
				minHeightRem: 9.375, // 150px / 16px = 9.375rem
				maxWidthRem: 31.25, // 500px / 16px = 31.25rem
				maxHeightRem: 25, // 400px / 16px = 25rem
				storageKey: 'notepads_data'
			};

            // Fungsi helper untuk konversi px ke rem (berdasarkan root font size)
            // Asumsikan 1rem = 16px secara default, atau sesuai dengan CSS
            function pxToRem(px) {
                const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
                return px / rootFontSize;
            }

            function remToPx(rem) {
                const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
                return rem * rootFontSize;
            }
			
			// Database IndexedDB
			let db;
			const DB_NAME = 'NotepadDB';
			const DB_VERSION = 2; // Tingkatkan versi untuk schema update
			const STORE_NAME = 'files'; // Ubah nama store untuk lebih jelas
			
			// Kelas Notepad
			class Notepad {
				// NEW: Tambahkan manager sebagai argumen di constructor
				constructor(id, x = 50, y = 300, width = CONFIG.defaultWidthRem, height = CONFIG.defaultHeightRem, content = '', filename = '', manager) { 
					this.id = id;
					// Simpan posisi dan ukuran dalam rem
					this.x = pxToRem(x); 
					this.y = pxToRem(y);
					this.width = width; // Sudah dalam rem dari CONFIG
					this.height = height; // Sudah dalam rem dari CONFIG
					this.content = content;
					this.filename = filename;
					this.zIndex = this.generateZIndex();
					this.element = null;
					this.manager = manager; // NEW: Simpan referensi ke manager
					
					this.createNotepad();
					// Panggil setPosition dan setSize dengan nilai rem
					this.setPosition(this.x, this.y); 
					this.setSize(this.width, this.height);
					this.setContent(content);
					this.attachEvents();
				}
				
				generateZIndex() {
					return Date.now();
				}
				
				createNotepad() {
					// Buat elemen notepad
					this.element = document.createElement('div');
					this.element.className = 'notepad';
					this.element.setAttribute('data-id', this.id);
					this.element.style.zIndex = this.zIndex;
					
					// Struktur HTML dengan tombol file operations
					this.element.innerHTML = `
						<div class="notepad-head">
							<span class="notepad-title">${this.filename || 'Notepad ' + this.id}</span>
							<div class="notepad-controls">
								<button class="notepad-close" title="Tutup">×</button>
							</div>
						</div>
						<div class="notepad-file-operations">
							<button class="notepad-file-btn notepad-save-btn">Save</button>
							<button class="notepad-file-btn notepad-save-db-btn notepad-hidden">Save</button>
							<button class="notepad-file-btn notepad-open-btn">Open</button>
							<input type="text" class="notepad-input-file-name notepad-hidden" placeholder="File Name...">
						</div>
						<textarea class="notepad-textarea" placeholder="Type here..."></textarea>
						<div class="notepad-resize-handle"></div>
					`;
					
					// Tambahkan ke body
					document.body.appendChild(this.element);
					
					// Fokus ke textarea
					this.element.querySelector('.notepad-textarea').focus();
				}
				
				setPosition(xRem, yRem) { // Menerima nilai dalam rem
					this.x = xRem;
					this.y = yRem;
					this.element.style.left = xRem + 'rem';
					this.element.style.top = yRem + 'rem';
				}
				
				setSize(widthRem, heightRem) { // Menerima nilai dalam rem
					this.width = Math.max(CONFIG.minWidthRem, Math.min(widthRem, CONFIG.maxWidthRem));
					this.height = Math.max(CONFIG.minHeightRem, Math.min(heightRem, CONFIG.maxHeightRem));
					this.element.style.width = this.width + 'rem';
					this.element.style.height = this.height + 'rem';
					
					// Sesuaikan ukuran textarea (perhitungan perlu diubah jika 30px dan offsetHeight juga diubah ke rem)
					// Untuk sementara, jika layout CSS masih pakai px, biarkan ini mengkonversi kembali ke px
					const textarea = this.element.querySelector('.notepad-textarea');
					const fileOps = this.element.querySelector('.notepad-file-operations');

                    // Asumsikan tinggi head 30px dan fileOps.offsetHeight masih dalam px
                    const headHeightPx = 30; // Tetap 30px karena di CSS belum diubah ke rem
                    const fileOpsHeightPx = fileOps.offsetHeight; // Ini akan menghasilkan px

                    // Ubah tinggi notepad keseluruhan dari rem ke px untuk perhitungan ini
                    const totalHeightPx = remToPx(this.height);
					textarea.style.height = (totalHeightPx - headHeightPx - fileOpsHeightPx) + 'px';
				}
				
				setContent(content) {
					this.content = content;
					this.element.querySelector('.notepad-textarea').value = content;
				}
				
				setFilename(filename) {
					if (filename && !filename.includes('.')) {
						filename += '.txt';
					}
					this.filename = filename;
					this.element.querySelector('.notepad-title').textContent = filename || 'Notepad ' + this.id;
				}
				
				bringToFront() {
					this.zIndex = this.generateZIndex();
					this.element.style.zIndex = this.zIndex;
				}
				
				attachEvents() {
					const head = this.element.querySelector('.notepad-head');
					const textarea = this.element.querySelector('.notepad-textarea');
					const resizeHandle = this.element.querySelector('.notepad-resize-handle');
					const closeBtn = this.element.querySelector('.notepad-close');
					const saveBtn = this.element.querySelector('.notepad-save-btn');
					const saveDbBtn = this.element.querySelector('.notepad-save-db-btn');
					const openBtn = this.element.querySelector('.notepad-open-btn');
					const filenameInput = this.element.querySelector('.notepad-input-file-name');
					
					let isDragging = false;
					let isResizing = false;
					// Variabel startX, startY, startWidth, startHeight sekarang menyimpan nilai dalam rem
					let startXRem, startYRem, startWidthRem, startHeightRem; 

                    // Helper function to get coordinates
                    const getCoords = (e) => {
                        if (e.touches && e.touches.length > 0) {
                            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
                        }
                        return { x: e.clientX, y: e.clientY };
                    };
					
					// Event untuk menggeser (Mouse & Touch)
					const startDrag = (e) => {
						if (e.target === closeBtn) return;
						
						isDragging = true;
						this.bringToFront();
						
                        const coords = getCoords(e);
						// Hitung offset dalam rem
						startXRem = pxToRem(coords.x) - this.x; 
						startYRem = pxToRem(coords.y) - this.y;
						
						head.style.cursor = 'grabbing';
						e.preventDefault(); // Mencegah scrolling default pada touch
					};

                    head.addEventListener('mousedown', startDrag);
                    head.addEventListener('touchstart', startDrag); // Tambahkan event touchstart
					
					// Event untuk resize (Mouse & Touch)
					const startResize = (e) => {
						isResizing = true;
						this.bringToFront();
						
                        const coords = getCoords(e);
						// Simpan posisi awal kursor dan ukuran awal notepad dalam rem
						startXRem = pxToRem(coords.x);
						startYRem = pxToRem(coords.y);
						startWidthRem = this.width;
						startHeightRem = this.height;
						
						document.body.style.cursor = 'nw-resize';
						e.preventDefault(); // Mencegah scrolling default pada touch
					};

                    resizeHandle.addEventListener('mousedown', startResize);
                    resizeHandle.addEventListener('touchstart', startResize); // Tambahkan event touchstart
					
					// Event untuk menutup
					closeBtn.addEventListener('click', () => {
						this.close();
					});
					
					// Event untuk menyimpan konten
					textarea.addEventListener('input', () => {
						this.content = textarea.value;
					});
					
					// Event untuk save
					saveBtn.addEventListener('click', () => {
						saveBtn.classList.add('notepad-hidden');
						saveDbBtn.classList.remove('notepad-hidden');
						filenameInput.classList.remove('notepad-hidden');
						filenameInput.focus();
						filenameInput.value = this.filename || '';
					});

					saveDbBtn.addEventListener('click', () => {
						const filename = filenameInput.value.trim();
						if (filename) {
							this.setFilename(filename);
							this.saveToFile();
							filenameInput.classList.add('notepad-hidden');
							saveBtn.classList.remove('notepad-hidden');
							saveDbBtn.classList.add('notepad-hidden');
						}
					});			
					
					// Event untuk open
					openBtn.addEventListener('click', () => {
						this.showFileList();
					});
					
					textarea.addEventListener('keydown', (e) => {
						if (e.ctrlKey || e.metaKey) {
							if (e.key === 's') {
								e.preventDefault();
								saveBtn.click();
							}
							if (e.key === 'o') {
								e.preventDefault();
								openBtn.click();
							}
						}
					});
					
					// Event untuk input nama file (saat tekan Enter)
					filenameInput.addEventListener('keypress', (e) => {
						if (e.key === 'Enter') {
							const filename = filenameInput.value.trim();
							if (filename) {
								this.setFilename(filename);
								this.saveToFile();
								filenameInput.classList.add('notepad-hidden');
								saveBtn.classList.remove('notepad-hidden');
								saveDbBtn.classList.add('notepad-hidden');
							}
						}
					});
					
					// Sembunyikan input saat klik di luar
					filenameInput.addEventListener('blur', () => {
						setTimeout(() => {
							filenameInput.classList.add('notepad-hidden');
							saveBtn.classList.remove('notepad-hidden');
							saveDbBtn.classList.add('notepad-hidden');
						}, 200);
					});
					
					// Event global mousemove / touchmove
					const doMove = (e) => {
                        const coords = getCoords(e);
                        const clientXRem = pxToRem(coords.x);
                        const clientYRem = pxToRem(coords.y);

						if (isDragging) {
							const newX = clientXRem - startXRem;
							const newY = clientYRem - startYRem;
							
							// Batasi agar tidak keluar layar, perhitungan ini juga harus dalam rem
                            const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
                            const windowWidthRem = window.innerWidth / rootFontSize;
                            const windowHeightRem = window.innerHeight / rootFontSize;

							const maxXRem = windowWidthRem - this.width;
							const maxYRem = windowHeightRem - this.height;

                            // Margin juga dalam rem
                            const marginRem = pxToRem(10); // Asumsikan margin 10px

							this.setPosition(
								Math.max(marginRem, Math.min(newX, maxXRem - marginRem)), 
								Math.max(marginRem, Math.min(newY, maxYRem - marginRem))
							);
                            e.preventDefault(); // Mencegah scrolling default pada touch
						}
						
						if (isResizing) {
							const newWidth = startWidthRem + (clientXRem - startXRem);
							const newHeight = startHeightRem + (clientYRem - startYRem);
							
							this.setSize(newWidth, newHeight);
                            e.preventDefault(); // Mencegah scrolling default pada touch
						}
					};

                    document.addEventListener('mousemove', doMove);
                    document.addEventListener('touchmove', doMove, { passive: false }); // Gunakan passive: false untuk preventDefault
					
					// Event global mouseup / touchend
					const endInteraction = () => {
						if (isDragging) {
							isDragging = false;
							head.style.cursor = 'grab';
						}
						
						if (isResizing) {
							isResizing = false;
							document.body.style.cursor = 'default';
						}
					};

                    document.addEventListener('mouseup', endInteraction);
                    document.addEventListener('touchend', endInteraction); // Tambahkan event touchend
                    document.addEventListener('touchcancel', endInteraction); // Juga tangani touchcancel
					
					// Event untuk membawa ke depan saat klik (Mouse & Touch)
					const bringToFrontOnInteraction = () => {
						this.bringToFront();
					};
                    this.element.addEventListener('mousedown', bringToFrontOnInteraction);
                    this.element.addEventListener('touchstart', bringToFrontOnInteraction); // Tambahkan event touchstart
				}
				
				async saveToFile() {
					try {
						const data = {
							filename: this.filename, // Gunakan filename sebagai identifier utama
							content: this.content,
							timestamp: Date.now()
						};
						
						await saveFileToDB(data);
						console.log(`File "${this.filename}" berhasil disimpan`);
					} catch (error) {
						console.error('Gagal menyimpan file:', error);
					}
				}
				
				async showFileList() {
					try {
						const files = await getAllFilesFromDB();
						
						// Buat modal untuk menampilkan daftar file
						const modal = document.createElement('div');
						modal.className = 'notepad-file-modal';
						const ul = document.createElement("ul");
						ul.classList.add("notepad-file-list");

						files.forEach(file => {
							const li = document.createElement("li");
							li.dataset.filename = file.filename;

							const name = document.createElement("span");
							name.className = "notepad-filename";
							name.textContent = file.filename;

							const date = document.createElement("span");
							date.className = "notepad-file-date";
							date.textContent = new Date(file.timestamp).toLocaleString();

							const del = document.createElement("button");
							del.className = "notepad-file-delete-btn";
							del.title = "Delete file";
							del.textContent = "×";

							li.append(name, date, del);
							ul.appendChild(li);
						});

						modal.innerHTML = `
							<div class="notepad-file-modal-content">
								<h3>Select File</h3>
							</div>
						`;
						modal.querySelector(".notepad-file-modal-content").append(ul);
						modal.querySelector(".notepad-file-modal-content").insertAdjacentHTML("beforeend", `<button class="notepad-modal-close">Close</button>`);

						
						document.body.appendChild(modal);
						
						if (modal.querySelectorAll('.notepad-file-list li').length === 0) {
							modal.querySelector('.notepad-file-list').textContent="Not found";
						}
						
						// Event untuk memilih file
						modal.querySelectorAll('.notepad-file-list li').forEach(li => {
							const filename = li.getAttribute('data-filename');
							const filenameSpan = li.querySelector('.notepad-filename');
							
							filenameSpan.addEventListener('click', async () => {
								const fileData = await getFileFromDB(filename);
								
								if (fileData) {
									this.setContent(fileData.content);
									this.setFilename(fileData.filename);
								}
								
								modal.remove();
							});
							
							// Event untuk menghapus file
							const deleteBtn = li.querySelector('.notepad-file-delete-btn');
							deleteBtn.addEventListener('click', async (e) => {
								e.stopPropagation();
								if (confirm(`Delete file "${filename}"?`)) {
									await deleteFileFromDB(filename);
									li.remove();
									
									// Jika tidak ada file lagi, tutup modal
									if (modal.querySelectorAll('.notepad-file-list li').length === 0) {
										modal.remove();
									}
								}
							});
						});
						
						// Event untuk menutup modal
						modal.querySelector('.notepad-modal-close').addEventListener('click', () => {
							modal.remove();
						});
						
						// Tutup modal saat klik di luar
						modal.addEventListener('click', (e) => {
							if (e.target === modal) {
								modal.remove();
							}
						});
						
					} catch (error) {
						console.error('Gagal memuat daftar file:', error);
					}
				}
				
				close() {
					if (this.element && this.element.parentNode) {
						this.element.parentNode.removeChild(this.element);
					}
					// NEW: Panggil metode removeNotepad dari manager saat notepad ditutup
					if (this.manager) {
						this.manager.removeNotepad(this.id);
					}
				}
			}
			
			// Fungsi IndexedDB - DIUBAH: Gunakan filename sebagai key
			function initDB() {
				return new Promise((resolve, reject) => {
					const request = indexedDB.open(DB_NAME, DB_VERSION);
					
					request.onerror = () => reject(request.error);
					request.onsuccess = () => resolve(request.result);
					
					request.onupgradeneeded = (event) => {
						db = event.target.result;
						if (!db.objectStoreNames.contains(STORE_NAME)) {
							const store = db.createObjectStore(STORE_NAME, { keyPath: 'filename' });
							store.createIndex('timestamp', 'timestamp', { unique: false });
						}
					};
				});
			}
			
			function saveFileToDB(fileData) {
				return new Promise((resolve, reject) => {
					if (!db) {
						reject(new Error('Database not initialized'));
						return;
					}
					
					const transaction = db.transaction([STORE_NAME], 'readwrite');
					const store = transaction.objectStore(STORE_NAME);
					
					const request = store.put(fileData);
					
					request.onerror = () => reject(request.error);
					request.onsuccess = () => resolve(request.result);
				});
			}
			
			function getAllFilesFromDB() {
				return new Promise((resolve, reject) => {
					if (!db) {
						reject(new Error('Database not initialized'));
						return;
					}
					
					const transaction = db.transaction([STORE_NAME], 'readonly');
					const store = transaction.objectStore(STORE_NAME);
					const request = store.getAll();
					
					request.onerror = () => reject(request.error);
					request.onsuccess = () => {
						const files = request.result
							.filter(file => file.filename) // Hanya file yang memiliki nama
							.sort((a, b) => b.timestamp - a.timestamp); // Urutkan berdasarkan terbaru
						resolve(files);
					};
				});
			}
			
			function getFileFromDB(filename) {
				return new Promise((resolve, reject) => {
					if (!db) {
						reject(new Error('Database not initialized'));
						return;
					}
					
					const transaction = db.transaction([STORE_NAME], 'readonly');
					const store = transaction.objectStore(STORE_NAME);
					const request = store.get(filename);
					
					request.onerror = () => reject(request.error);
					request.onsuccess = () => resolve(request.result);
				});
			}
			
			function deleteFileFromDB(filename) {
				return new Promise((resolve, reject) => {
					if (!db) return resolve();
					
					const transaction = db.transaction([STORE_NAME], 'readwrite');
					const store = transaction.objectStore(STORE_NAME);
					const request = store.delete(filename);
					
					request.onerror = () => reject(request.error);
					request.onsuccess = () => resolve();
				});
			}
			
			// Manajer Notepad
			class NotepadManager {
				constructor() {
					this.notepads = new Map();
					this.nextId = 1;
					this.availableIds = []; // NEW: Array untuk menyimpan ID yang tersedia kembali
					this.addButton = null;
					
					this.init();
				}
				
				async init() {
					// Tambahkan CSS
					this.injectStyles();
					
					// Inisialisasi database
					try {
						db = await initDB();
						console.log('Database initialized');
						
						// Buat notepad default
						// this.createNotepad(); // OLD: Jangan buat notepad default di sini, biar createNotepad yang tangani ID
						this.createNotepad(this.getAvailableId()); // NEW: Gunakan getAvailableId
					} catch (error) {
						console.error('Failed to initialize database:', error);
						// Buat notepad default meski tanpa database
						// this.createNotepad(); // OLD: Jangan buat notepad default di sini
						this.createNotepad(this.getAvailableId()); // NEW: Gunakan getAvailableId
					}
					
					// Tambahkan tombol tambah notepad
					this.createAddButton();
				}
				
				injectStyles() {
					const styles = `
						.notepad {
							position: fixed;
							background: white;
							border-radius: 0.3125rem; /* 5px */
							box-shadow: 0 0.25rem 0.9375rem rgba(0,0,0,0.2); /* 0 4px 15px */
							overflow: hidden;
							resize: none;
							font-family: Arial, sans-serif;
						}
						
						.notepad-head {
							height: 1.875rem; /* 30px */
							background: #c62828;
							color: white;
							display: flex;
							align-items: center;
							justify-content: space-between;
							padding: 0 0.625rem; /* 0 10px */
							cursor: grab;
							font-size: 0.875rem; /* 14px */
							font-weight: bold;
							user-select: none;
						}
						
						.notepad-head:active {
							cursor: grabbing;
						}
						
						.notepad-title {
							flex-grow: 1;
						}
						
						.notepad-controls {
							display: flex;
						}
						
						.notepad-close {
							background: none;
							border: none;
							color: white;
							cursor: pointer;
							font-size: 1.125rem; /* 18px */
							line-height: 1;
							padding: 0;
							width: 1.25rem; /* 20px */
							height: 1.25rem; /* 20px */
							display: flex;
							align-items: center;
							justify-content: center;
						}
						
						.notepad-close:hover {
							background: rgba(255,255,255,0.2);
							border-radius: 0.1875rem; /* 3px */
						}
						
						.notepad-file-operations {
							padding: 0.3125rem 0.625rem; /* 5px 10px */
							background: #f5f5f5;
							border-bottom: 0.0625rem solid #ddd; /* 1px */
							display: flex;
							gap: 0.3125rem; /* 5px */
						}
						
						.notepad-file-btn {
							padding: 0.25rem 0.5rem; /* 4px 8px */
							background: #c62828;
							color: white;
							border: none;
							border-radius: 0.1875rem; /* 3px */
							cursor: pointer;
							font-size: 0.75rem; /* 12px */
						}
						
						.notepad-file-btn:hover {
							background: #b71c1c;
						}
						
						.notepad-input-file-name {
							width: 100%;
							padding: 0.25rem 0.5rem; /* 4px 8px */
							border: 0.0625rem solid #ddd; /* 1px */
							border-radius: 0.1875rem; /* 3px */
							font-size: 0.75rem; /* 12px */
							flex-grow: 1;
						}
						
						.notepad-hidden{
							display: none!important;
						}
						
						.notepad-textarea {
							width: 100%;
							border: none;
							padding: 0.625rem; /* 10px */
							resize: none;
							outline: none;
							font-family: inherit;
							font-size: 0.875rem; /* 14px */
							background: #fff9f9;
						}
						
						.notepad-resize-handle {
							position: absolute;
							bottom: 0;
							right: 0;
							width: 0.9375rem; /* 15px */
							height: 0.9375rem; /* 15px */
							cursor: nw-resize;
							background: linear-gradient(135deg, transparent 0%, transparent 50%, #c62828 50%, #c62828 100%);
						}
						
						.add-notepad-btn {
							position: fixed;
							bottom: 1.25rem;
							left: 1.25rem;
							width: 3.125rem;
							height: 3.125rem;
							border-radius: 50%;
							background: white;
							color: red;
							border: none;
							font-size: 1.5rem;
							cursor: pointer;
							display: flex;
							align-items: center;
							justify-content: center;
							z-index: 10000;
							box-shadow: 0 0 0.3125rem #ffcc00, 0 0 0.9375rem #ff9900, 0 0 1.25rem #f60; /* 0 0 5px, 0 0 15px, 0 0 20px */
						}
						
						.add-notepad-btn:hover {
							background: orange;
							transform: scale(1.05);
						}
						
						/* Modal styles */
						.notepad-file-modal {
							position: fixed;
							top: 0;
							left: 0;
							width: 100%;
							height: 100%;
							background: rgba(0,0,0,0.5);
							display: flex;
							align-items: center;
							justify-content: center;
							z-index: 100000;
						}
						
						.notepad-file-modal-content {
							background: white;
							padding: 1.25rem; /* 20px */
							border-radius: 0.3125rem; /* 5px */
							box-shadow: 0 0.25rem 0.9375rem rgba(0,0,0,0.3); /* 0 4px 15px */
							max-width: 31.25rem; /* 500px */
							width: 90%;
							max-height: 80vh;
							overflow-y: auto;
						}
						
						.notepad-file-modal-content h3 {
							margin-top: 0;
							color: #c62828;
						}
						
						.notepad-file-list {
							list-style: none;
							padding: 0;
							margin: 0 0 0.9375rem 0; /* 0 0 15px 0 */
						}
						
						.notepad-file-list li {
							padding: 0.625rem; /* 10px */
							border: 0.0625rem solid #eee; /* 1px */
							margin-bottom: 0.3125rem; /* 5px */
							cursor: pointer;
							display: flex;
							justify-content: space-between;
							align-items: center;
							position: relative;
						}
						
						.notepad-file-list li:hover {
							background: #f9f9f9;
							border-color: #c62828;
						}
						
						.notepad-filename {
							font-weight: bold;
							color: #c62828;
							flex-grow: 1;
						}
						
						.notepad-file-date {
							font-size: 0.75rem; /* 12px */
							color: #666;
							margin-right: 1.5625rem; /* 25px */
						}
						
						.notepad-file-delete-btn {
							background: none;
							border: none;
							color: #999;
							cursor: pointer;
							font-size: 1rem; /* 16px */
							width: 1.25rem; /* 20px */
							height: 1.25rem; /* 20px */
							display: flex;
							align-items: center;
							justify-content: center;
							position: absolute;
							right: 0.3125rem; /* 5px */
							top: 50%;
							transform: translateY(-50%);
						}
						
						.notepad-file-delete-btn:hover {
							color: #c62828;
							background: rgba(198, 40, 40, 0.1);
							border-radius: 0.1875rem; /* 3px */
						}
						
						.notepad-modal-close {
							padding: 0.5rem 0.9375rem; /* 8px 15px */
							background: #c62828;
							color: white;
							border: none;
							border-radius: 0.1875rem; /* 3px */
							cursor: pointer;
						}
						
						.notepad-modal-close:hover {
							background: #b71c1c;
						}
					`;
					
					const styleSheet = document.createElement('style');
					styleSheet.textContent = styles;
					document.head.appendChild(styleSheet);
				}
				
				getAvailableId() {
					if (this.availableIds.length > 0) {
						// Ambil ID terkecil yang tersedia
						this.availableIds.sort((a, b) => a - b); // Pastikan terurut
						return this.availableIds.shift(); // Hapus dan kembalikan ID pertama
					}
					return this.nextId++; // Jika tidak ada, gunakan ID baru
				}

				// NEW: Metode untuk mengembalikan ID yang sudah tidak terpakai
				releaseId(id) {
					if (id < this.nextId && !this.availableIds.includes(id)) { // Hanya tambahkan jika valid dan belum ada
						this.availableIds.push(id);
					}
				}
				
				createNotepad(id = this.getAvailableId(), x = 50, y = 50, width = CONFIG.defaultWidth, height = CONFIG.defaultHeight, content = '', filename = '') {
					const notepad = new Notepad(id, x, y, width, height, content, filename, this); // NEW: Kirim instance manager ke notepad
					this.notepads.set(id, notepad);
					return notepad;
				}

				// NEW: Metode untuk menghapus notepad dari manager
				removeNotepad(id) {
					if (this.notepads.has(id)) {
						this.notepads.delete(id);
						this.releaseId(id); // Kembalikan ID ke daftar yang tersedia
					}
				}
				
				createAddButton() {
					this.addButton = document.createElement('button');
					this.addButton.className = 'add-notepad-btn';
					this.addButton.textContent = '+';
					this.addButton.title = 'Add New Notepad';
					
					this.addButton.addEventListener('click', () => {
						this.createNotepad(); // Akan memanggil getAvailableId secara otomatis
					});
					
					document.body.appendChild(this.addButton);
				}
			}
			
			// Inisialisasi saat halaman dimuat
				new NotepadManager();
		})();