/**
 * Hybrid Fetch & Fill
 * 
 * Fitur utama:
 * - Sanitasi hybrid (DOMPurify + fallback)
 * - Caching strategis (memory, session, none)
 * - Event custom lifecycle
 * - Validasi selector ketat
 * - Retry dengan exponential backoff
 * - Manajemen siklus hidup SPA
 * - Auto cleanup
 */

const fetchCache = new Map();
const EVENT_PREFIX = 'fetchandfill:';
const activeLoaders = new Set(); // Global registry for active loaders

// Fungsi cleanup global
function cleanupAllLoaders() {
    activeLoaders.forEach(loader => loader.abort());
    activeLoaders.clear();
}

// Auto cleanup saat navigasi SPA (PopState/PushState)
function setupSPACleanup() {
    try {
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function () {
            originalPushState.apply(this, arguments);
            window.dispatchEvent(new Event('spa-navigate'));
        };

        history.replaceState = function () {
            originalReplaceState.apply(this, arguments);
            window.dispatchEvent(new Event('spa-navigate'));
        };

        // Tangkap event popstate (back/forward)
        window.addEventListener('popstate', () => {
            window.dispatchEvent(new Event('spa-navigate'));
        });

        // Tangkap event navigasi dan cleanup
        window.addEventListener('spa-navigate', cleanupAllLoaders);
		
    } catch (error) {
        console.error('SPA cleanup setup failed:', error);
        // Fallback: cleanup on every load
        window.addEventListener('load', cleanupAllLoaders);
    }
}

// Auto cleanup saat window ditutup
function setupWindowCleanup() {
    window.addEventListener('beforeunload', cleanupAllLoaders);
    window.addEventListener('pagehide', cleanupAllLoaders);

    // Visibility API untuk tab background
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            cleanupAllLoaders();
        }
    });
}

// Inisialisasi auto cleanup (hanya di browser)
if (typeof window !== 'undefined') {
    setupSPACleanup();
    setupWindowCleanup();
}


function fetchAndFill(src, targetSelector, options = {}) {
	// Validasi ketat parameter input
	if (typeof src !== 'string' || !src.trim()) {
		throw new TypeError('Parameter src harus berupa string non-kosong');
	}

	if (typeof targetSelector !== 'string' || !targetSelector.trim()) {
		throw new TypeError('Parameter targetSelector harus berupa selector CSS yang valid');
	}

	// Konfigurasi default
	const config = {
		position: 'replace',
		relativeTo: null,
		runScripts: false,
		sanitize: true,
		sanitizerOptions: {
			ADD_TAGS: ['safe-custom-element'],
			FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
			FORBID_ATTR: ['onload', 'onerror', 'onclick'],
			ADD_ATTR: ['data-safe-attr']
		},
		cache: 'memory',
		maxRetries: 2,
		retryDelay: 1000,
		timeout: 30000,
		signal: null,
		...options
	};

	// AbortController untuk manajemen lifecycle
	const controller = new AbortController();
	const abortSignal = config.signal || controller.signal;

	// State management
	let observer, timeoutId, isFilled = false,
		retryCount = 0;

	// Event dispatching
	function dispatchEvent(eventName, detail) {
		const event = new CustomEvent(EVENT_PREFIX + eventName, {
			detail
		});
		document.dispatchEvent(event);
	}

	// Cleanup resources
	function cleanup() {
		observer?.disconnect();
		clearTimeout(timeoutId);
		if (!config.signal) controller.abort();
		dispatchEvent('cleanup', {
			src,
			targetSelector
		});
	}

	// Validasi selector
	function validateSelector(selector) {
		if (!selector || typeof selector !== 'string' || selector.trim() === '') {
			return false;
		}

		try {
			// Coba buat elemen dummy untuk validasi
			const temp = document.createElement('div');
			const testEl = document.createElement('div');
			temp.appendChild(testEl);

			// Coba query selector
			temp.querySelector(selector);
			return true;
		} catch (e) {
			console.warn(`Selector validation warning: "${selector}" - ${e.message}`);
			return false;
		}
	}

	// Main processing
	async function proceedFill(target) {
		if (isFilled) return;
		isFilled = true;

		try {
			// Validasi selector utama WAJIB
			if (!validateSelector(targetSelector)) {
				throw new Error(`Target selector invalid: "${targetSelector}"`);
			}

			// Validasi relativeTo selector jika ada (FIXED: Skip if empty)
			if (config.relativeTo && !validateSelector(config.relativeTo)) {
				console.warn(`Relative selector invalid: "${config.relativeTo}" - using fallback`);
				config.relativeTo = null;
			}

			dispatchEvent('start', {
				src,
				target,
				config
			});

			let html = null;
			const cacheKey = `cache:${src}`;

			// Cek cache berdasarkan strategi
			if (config.cache !== 'none') {
				if (config.cache === 'memory' && fetchCache.has(cacheKey)) {
					html = fetchCache.get(cacheKey);
					dispatchEvent('cachehit', {
						src,
						cacheType: 'memory'
					});
				} else if (config.cache === 'session') {
					const cached = sessionStorage.getItem(cacheKey);
					if (cached) {
						html = cached;
						dispatchEvent('cachehit', {
							src,
							cacheType: 'session'
						});
					}
				}
			}

			// Fetch jika tidak ada di cache
			if (!html) {
				const startTime = performance.now();

				const response = await fetchWithRetry(
					src,
					abortSignal,
					config.maxRetries,
					config.retryDelay
				);

				if (!response.ok) throw new Error(`HTTP ${response.status}`);

				html = await response.text();
				const duration = performance.now() - startTime;

				// Simpan ke cache
				if (config.cache === 'memory') {
					fetchCache.set(cacheKey, html);
				} else if (config.cache === 'session') {
					try {
						sessionStorage.setItem(cacheKey, html);
					} catch (e) {
						console.warn('Session storage full, cache not saved');
					}
				}

				dispatchEvent('fetch', {
					src,
					duration,
					size: html.length
				});
			}

			// Sanitasi HTML
			let sanitizedHtml = html;
			if (config.sanitize) {
				if (typeof DOMPurify !== 'undefined') {
					sanitizedHtml = DOMPurify.sanitize(html, config.sanitizerOptions);
				} else {
					sanitizedHtml = fallbackSanitize(html);
					dispatchEvent('fallbacksanitize', {
						src
					});
				}
			}

			// Parse dan siapkan konten
			const doc = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
			const fragment = document.createDocumentFragment();

			while (doc.body.firstChild) {
				fragment.appendChild(doc.body.firstChild);
			}

			// Penempatan konten
			handlePosition(target, fragment, config.position, config.relativeTo);

			// Jalankan script jika diizinkan
			if (config.runScripts) {
				reinitScripts(target, config.sanitize);
			}

			dispatchEvent('success', {
				src,
				target,
				fragment
			});

		} catch (err) {
			if (err.name !== 'AbortError') {
				console.error(`[fetchAndFill] Error loading "${src}"`, err);
				dispatchEvent('error', {
					src,
					target,
					error: err
				});

				// Fallback UI untuk error (FIXED: null element handling)
				if (target && config.position === 'replace') {
					displayError(target, err, src);
				} else {
					console.error('Cannot display error UI - target element not available');
				}
			}
		}
	}

	// Implementasi fetch dengan retry
	async function fetchWithRetry(url, signal, maxRetries, retryDelay) {
		try {
			const response = await fetch(url, {
				signal
			});

			if (response.ok) return response;

			if (response.status >= 500 && retryCount < maxRetries) {
				throw new Error(`HTTP ${response.status}`);
			}

			return response;
		} catch (err) {
			if (retryCount < maxRetries) {
				retryCount++;
				const delay = retryDelay * Math.pow(2, retryCount);

				dispatchEvent('retry', {
					src,
					retryCount,
					delay
				});

				await new Promise(res => setTimeout(res, delay));
				return fetchWithRetry(url, signal, maxRetries, retryDelay);
			}
			throw err;
		}
	}

	// Fallback sanitizer jika DOMPurify tidak tersedia
	function fallbackSanitize(html) {
		const temp = document.createElement('div');
		temp.innerHTML = html;

		// Hapus elemen berbahaya
		const forbidden = ['script', 'iframe', 'object', 'embed', 'form', 'link'];
		forbidden.forEach(tag => {
			temp.querySelectorAll(tag).forEach(el => el.remove());
		});

		// Hapus atribut berbahaya
		temp.querySelectorAll('*').forEach(el => {
			const attrs = el.attributes;
			for (let i = attrs.length - 1; i >= 0; i--) {
				const attr = attrs[i];
				if (attr.name.startsWith('on') ||
					(attr.name === 'src' && /^javascript:/i.test(attr.value)) ||
					(attr.name === 'href' && /^javascript:/i.test(attr.value)) ||
					(attr.name === 'style' && /expression|javascript/i.test(attr.value))) {
					el.removeAttribute(attr.name);
				}
			}
		});

		return temp.innerHTML;
	}

	// Error handling UI
	function displayError(target, error, src) {
		// Pastikan target valid
		if (!target || !(target instanceof Element)) {
			console.error('Cannot display error - invalid target element');
			return;
		}

		const errorEl = document.createElement('div');
		errorEl.className = 'fetch-fill-error';
		errorEl.innerHTML = `
            <div style="text-align:center; padding:30px;">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:#f72585;"></i>
                <h3 style="margin:15px 0;color:#dc3545;">Gagal Memuat Konten</h3>
                <p>${error.message}</p>
                <p style="font-size:0.9rem;margin-top:10px;color:#6c757d;">Source: ${src}</p>
                <button class="btn" style="margin-top:20px;background:var(--danger);">
                    <i class="fas fa-redo"></i> Coba Lagi
                </button>
            </div>
        `;

		// Null check sebelum menambahkan event listener
		const btn = errorEl.querySelector('.btn');
		if (btn) {
			btn.addEventListener('click', () => {
				errorEl.remove();
				isFilled = false;
				retryCount = 0;
				proceedFill(target);
			});
		} else {
			console.error('Error button element not found in error UI');
		}

		target.replaceChildren(errorEl);
	}

	// Position handling logic
	function handlePosition(target, fragment, position, relativeTo) {
		switch (position) {
			case 'replace':
				target.replaceChildren(fragment);
				break;
			case 'append':
				target.appendChild(fragment);
				break;
			case 'prepend':
				target.prepend(fragment);
				break;
			case 'before':
			case 'after':
				if (!relativeTo) throw new Error('relativeTo required for before/after');
				const ref = target.querySelector(relativeTo);
				if (ref) {
					ref[position](fragment);
				} else {
					console.warn(`Reference not found: ${relativeTo} - using append`);
					target.appendChild(fragment);
				}
				break;
			default:
				throw new Error(`Invalid position: ${position}`);
		}
	}

	// Reinitialize scripts dengan penanganan khusus
	function reinitScripts(container, isSanitized) {
		container.querySelectorAll('script').forEach(oldScript => {
			// Skip external scripts jika disanitasi
			if (isSanitized && oldScript.src) {
				console.warn('Skipping external script for security');
				return;
			}

			const newScript = document.createElement('script');

			// Copy attributes
			Array.from(oldScript.attributes).forEach(attr => {
				// Skip event attributes jika disanitasi
				if (!isSanitized || !attr.name.startsWith('on')) {
					newScript.setAttribute(attr.name, attr.value);
				}
			});

			// Copy content (hanya untuk inline scripts)
			if (!oldScript.src) {
				newScript.textContent = oldScript.textContent;
			}

			// Replace dengan penanganan error
			try {
				oldScript.replaceWith(newScript);
			} catch (err) {
				console.error('Script replacement error', err);
			}
		});
	}

	// Observer callback
	function mutationCallback() {
		const target = document.querySelector(targetSelector);
		if (target && !isFilled) {
			cleanup();
			proceedFill(target);
		}
	}

	// Eksekusi awal
	try {
		validateSelector(targetSelector);

		const target = document.querySelector(targetSelector);
		if (target) {
			proceedFill(target);
		} else {
			// Setup observer
			observer = new MutationObserver(mutationCallback);
			observer.observe(document.documentElement, {
				childList: true,
				subtree: true,
				attributeFilter: ['id', 'class']
			});

			// Timeout fallback
			timeoutId = setTimeout(() => {
				if (!isFilled) {
					enhancedCleanup(); 
					const err = new Error(`Target element not found: ${targetSelector}`);
					dispatchEvent('error', { src, error: err });
					throw err;
				}
			}, config.timeout);

			// Handle abort signal
			abortSignal.addEventListener('abort', enhancedCleanup);
		}
	} catch (err) {
		dispatchEvent('error', {
			src,
			error: err
		});
		throw err;
	}

    // Buat objek loader
    const loader = {
        abort: cleanup,
        on: (event, handler) => {
            const eventName = EVENT_PREFIX + event;
            document.addEventListener(eventName, handler);
            return () => document.removeEventListener(eventName, handler);
        }
    };

    // Daftarkan loader ke registry global
    activeLoaders.add(loader);

    // fungsi cleanup baru yang akan membersihkan dan unregister
    const enhancedCleanup = () => {
        cleanup(); // panggil cleanup asli
        activeLoaders.delete(loader); // unregister
    };

    // Ganti metode abort pada loader
    loader.abort = enhancedCleanup;

    // Kembalikan loader
    return loader;
}

// Ekspos fungsi 
export {
	fetchAndFill,
	cleanupAllLoaders
};
