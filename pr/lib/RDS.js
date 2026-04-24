// Responsive Design System (RDS) - Ultimate Edition
const RDS = (() => {
	// Konfigurasi default 
	const defaultConfig = {
		desktop: {
			baseWidth: 1920,
			baseHeight: 1080,
			minScale: 0.1,
			maxScale: 1.5
		},
		tablet: { 
			baseWidth: 1024,
			baseHeight: 768,
			minScale: 0.2,
			maxScale: 1.3
		},
		mobile: {
			baseWidth: 375,
			baseHeight: 667,
			minScale: 0.2,
			maxScale: 1.2
		},
		baseFontSize: '16px',

		breakpoints: {
			mobile: 768, 
			tablet: 1024 
		},
		forceMode: 'auto', // 'auto', 'desktop', 'tablet', 'mobile'
		debug: true,
		autoConvertJS: true, 
		cssVarName: '--rds-scale',
		remMode: 'responsive', // 'static' | 'responsive' | 'hybrid'
		remBaseSize: 16,
		/**
		 * Hook yang dipanggil sebelum skala diperbarui
		 * @param {Object} context - Konteks saat ini { mode, scale, config }
		 * @returns {Object|null} Dapat mengembalikan objek dengan properti yang akan ditimpa
		 */
		beforeUpdate: null,
		/**
		 * Hook yang dipanggil setelah skala diperbarui
		 * @param {Object} context - Konteks saat ini { mode, scale, config }
		 */
		afterUpdate: null
	};

	// State
	let config = {
		...defaultConfig
	};
	let currentScale = 1;
	let isTicking = false;
	let currentMode = 'desktop';
	let lastViewportWidth = 0;
	let lastViewportHeight = 0;
	let remConversionObserver = null;

	// --- Fungsi Internal ---

	/**
	 * Deep merge objek
	 */
	const deepMerge = (target, source) => {
		const isObject = obj => obj && typeof obj === 'object';

		if (!isObject(target) || !isObject(source)) {
			return source;
		}

		Object.keys(source).forEach(key => {
			const targetValue = target[key];
			const sourceValue = source[key];

			if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
				target[key] = targetValue.concat(sourceValue);
			} else if (isObject(targetValue) && isObject(sourceValue)) {
				target[key] = deepMerge({
					...targetValue
				}, sourceValue);
			} else {
				target[key] = sourceValue;
			}
		});

		return target;
	};

	/**
	 * Menerapkan font scaling global
	 */
	const applyGlobalFontScaling = () => {
		if (!config.baseFontSize) return;

		let style = document.getElementById('rds-global-font');
		if (!style) {
			style = document.createElement('style');
			style.id = 'rds-global-font';
			document.head.prepend(style);
		}

		const fontSize = config.remMode === 'static' ?
			config.baseFontSize :
			`calc(${config.baseFontSize} * var(${config.cssVarName}))`;

		style.textContent = `
    :root, body {
        font-size: ${fontSize};
    }

    h1 { font-size: 2em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1em; }
    h5 { font-size: 0.875em; }
    h6 { font-size: 0.75em; }

    a, abbr, address, article, aside, b, bdi, bdo, blockquote, button, caption, cite, code, 
    data, datalist, dd, del, details, dfn, dialog, div, dl, dt, em, fieldset, figcaption, 
    figure, footer, form, header, hgroup, i, input, ins, kbd, label, legend, li, mark, menu, 
    meter, nav, noscript, ol, optgroup, option, output, p, pre, progress, q, rp, rt, ruby, 
    s, samp, section, select, small, span, strong, sub, sup, table, tbody, td, textarea, 
    tfoot, th, thead, time, tr, u, ul, var {
        font-size: inherit;
    }`;
	};

	/**
		* Mengonversi nilai CSS px ke rem, aman dari fungsi url()
	 */
	const convertCSSValue = (value, base) => {
		if (!value || typeof value !== 'string') return value;

		// Regex menangkap url() utuh, selector escaped \[...\], ATAU nilai px. 
		// Jika grup ke-1 (pxValue) terisi, itu adalah px. Jika tidak, itu adalah url() atau selector dan diabaikan.
		return value.replace(/(?:url\(['"]?[^)]*?['"]?\))|(?:\\\[.*?\\\])|([-+]?\d*\.?\d+)px/gi, (match, pxValue) => {
			if (!pxValue) return match; // Mengembalikan url() atau escaped bracket tanpa diubah
				
			if (parseFloat(pxValue) === 0) return '0';
			const remValue = pxValue / base;
			const formatted = parseFloat(remValue.toFixed(4));
			return formatted === 0 ? '0' : `${formatted}rem`;
		});
	};

	/**
	 * Memproses CSS Rules secara rekursif (Future-proof untuk semua At-Rules modern)
	 */
	const processCSSRules = (rules, base) => {
		Array.from(rules).forEach(rule => {
			try {
				// 1. Jika memiliki style declaration (aturan biasa / keyframe frame)
				if (rule.style) {
					for (let i = 0; i < rule.style.length; i++) {
						const prop = rule.style[i];
						const value = rule.style.getPropertyValue(prop);
						if (value && value.includes('px')) {
							const priority = rule.style.getPropertyPriority(prop);
							rule.style.setProperty(prop, convertCSSValue(value, base), priority);
						}
					}
				}
				// 2. Jika memiliki nested rules (@media, @supports, @layer, @container, @keyframes)
				if (rule.cssRules) {
					processCSSRules(rule.cssRules, base);
				}
			} catch (e) {
				// Abaikan error pada aturan spesifik yang tidak bisa dimodifikasi
			}
		});
	};

	/**
	 * Mengonversi seluruh stylesheet ke rem
	 */
	const convertAllStylesheetsToRem = (base) => {
		Array.from(document.styleSheets).forEach(sheet => {
			// Cegah DOMException pada stylesheet lintas domain (CORS)
			try {
				if (!sheet.href || sheet.href.startsWith(window.location.origin)) {
					processCSSRules(sheet.cssRules, base);
				}
			} catch (e) {
				if (config.debug) console.warn('RDS: Could not process stylesheet (CORS)', sheet.href);
			}
		});

		document.querySelectorAll('[style]').forEach(el => {
			const style = el.getAttribute('style');
			if(style) el.setAttribute('style', convertCSSValue(style, base));
		});

		document.querySelectorAll('style').forEach(styleTag => {
			styleTag.textContent = convertCSSValue(styleTag.textContent, base);
		});
	};


	/**
	 * Menentukan mode berdasarkan konfigurasi dan viewport
	 */
	const determineMode = () => {
		if (config.forceMode !== 'auto') {
			return config.forceMode;
		}
		
		const width = window.innerWidth;
		// Mengevaluasi menggunakan 2 breakpoints yang telah diupdate
		if (width < config.breakpoints.mobile) {
			return 'mobile';
		} else if (width < config.breakpoints.tablet) {
			return 'tablet';
		} else {
			return 'desktop';
		}
	};

	/**
	 * Memperbarui skala berdasarkan mode aktif
	 */
	const update = () => {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		// Cek apakah viewport benar-benar berubah
		if (!config.debug &&
			viewportWidth === lastViewportWidth &&
			viewportHeight === lastViewportHeight) {
			isTicking = false;
			return;
		}

		lastViewportWidth = viewportWidth;
		lastViewportHeight = viewportHeight;

		// 1. Tentukan mode & periksa perubahan
		const newMode = determineMode();
		const modeChanged = newMode !== currentMode;

		if (modeChanged) {
			currentMode = newMode;
			document.body.setAttribute('data-rds-mode', currentMode);
			if (config.debug) {
				console.log(`%cRDS: Mode changed to ${currentMode}`, 'color: #4CAF50; font-weight: bold;');
			}
		}

		// 2. Dapatkan konfigurasi aktif
		const activeConfig = config[currentMode];
		if (!activeConfig) {
			console.error(`RDS: Configuration for mode "${currentMode}" is missing. Using fallback.`);
			return;
		}

		// 3. Kalkulasi skala
		const widthRatio = viewportWidth / activeConfig.baseWidth;
		const heightRatio = viewportHeight / activeConfig.baseHeight;
		let scale = Math.min(widthRatio, heightRatio);
		scale = Math.max(activeConfig.minScale, Math.min(scale, activeConfig.maxScale));

		// 4. Hook beforeUpdate
		const context = {
			mode: currentMode,
			scale,
			config: activeConfig,
			viewport: {
				width: viewportWidth,
				height: viewportHeight
			}
		};

		let override = null;
		if (typeof config.beforeUpdate === 'function') {
			override = config.beforeUpdate(context) || null;
		}

		// 5. Terapkan skala
		currentScale = override?.scale !== undefined ? override.scale : scale;
		document.documentElement.style.setProperty(config.cssVarName, currentScale);

		// 6. Terapkan font scaling
		applyGlobalFontScaling();

		// 7. Hook afterUpdate
		if (typeof config.afterUpdate === 'function') {
			config.afterUpdate({
				...context,
				scale: currentScale,
				modeChanged
			});
		}

		if (config.debug) {
			console.log(`%cRDS: ${currentMode.toUpperCase()} | Scale: ${currentScale.toFixed(4)} | Viewport: ${viewportWidth}×${viewportHeight}`,
				'background: #222; color: #bada55; padding: 2px 4px; border-radius: 3px;');
		}

		isTicking = false;
	};

	/**
	 * Handler untuk peristiwa resize dan orientationchange
	 */
	const handleEvent = () => {
		if (!isTicking) {
			isTicking = true;
			requestAnimationFrame(update);
		}
	};


	/**
	 * Observasi perubahan DOM dengan perlindungan rekursi
	 */
	const observeDOMChanges = () => {
		if (remConversionObserver) remConversionObserver.disconnect();
		
		remConversionObserver = new MutationObserver((mutations) => {
			// Matikan sementara untuk mencegah infinite loop saat script ini mengubah style
			remConversionObserver.disconnect();

			mutations.forEach((mutation) => {
				if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === Node.ELEMENT_NODE) {
							if (node.hasAttribute('style')) {
								node.setAttribute('style', convertCSSValue(node.getAttribute('style'), config.remBaseSize));
							}
							if (node.tagName === 'STYLE') {
								node.textContent = convertCSSValue(node.textContent, config.remBaseSize);
							}
							node.querySelectorAll('[style]').forEach(el => {
								el.setAttribute('style', convertCSSValue(el.getAttribute('style'), config.remBaseSize));
							});
							node.querySelectorAll('style').forEach(styleTag => {
								styleTag.textContent = convertCSSValue(styleTag.textContent, config.remBaseSize);
							});
						}
					});
				}
				
				if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
					const target = mutation.target;
					target.setAttribute('style', convertCSSValue(target.getAttribute('style'), config.remBaseSize));
				}
			});

			// Nyalakan kembali observer
			remConversionObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
		});

		// Memulai observasi
		remConversionObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
	};
	
	let isProxyEnabled = false;
    const originalStyleDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
	
	const enableStyleProxy = () => {
	  // 1. Skip jika Proxy tidak didukung atau sudah aktif
	  if (typeof Proxy === 'undefined' || window.__RDS_PROXY_ACTIVE__) {
		if (config.debug && typeof Proxy === 'undefined') {
		  console.warn('RDS: Proxy not supported, auto-conversion disabled');
		}
		return;
	  }

	  // 2. Simpan descriptor asli
	  const originalStyleDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
	  if (!originalStyleDescriptor) return;

	  // 3. Daftar komprehensif properti yang tidak memerlukan px (Unitless Properties)
	  const EXCLUDED_PROPS = [
		  'zIndex', 'z-index', 'fontWeight', 'font-weight', 'lineHeight', 'line-height',
		  'opacity', 'zoom', 'flex', 'flexGrow', 'flex-grow', 'flexShrink', 'flex-shrink',
		  'order', 'gridColumn', 'grid-column', 'gridRow', 'grid-row', 'gridColumnStart',
		  'gridColumnEnd', 'gridRowStart', 'gridRowEnd', 'columnCount', 'column-count',
		  'animationIterationCount', 'animation-iteration-count', 'scale', 'scaleX', 'scaleY',
		  'scaleZ', 'tabSize', 'tab-size', 'strokeWidth', 'stroke-width', 'fillOpacity',
		  'fill-opacity', 'strokeOpacity', 'stroke-opacity'
	  ];
	  // 4. Implementasi Proxy
	  Object.defineProperty(HTMLElement.prototype, 'style', {
		get() {
		  const style = originalStyleDescriptor.get.call(this);
		  
		  return new Proxy(style, {
			set(target, prop, value) {
			  // Skip jika bukan properti yang perlu diproses
			  if (EXCLUDED_PROPS.includes(prop) || typeof value === 'undefined') {
				return Reflect.set(target, prop, value);
			  }

			  // Handle number (asumsi px)
			  if (typeof value === 'number') {
				return Reflect.set(
				  target, 
				  prop, 
				  convertCSSValue(`${value}px`, config.remBaseSize)
				);
			  }

			  // Handle string dengan px
			  if (typeof value === 'string' && /\dpx\b/.test(value)) {
				return Reflect.set(
				  target, 
				  prop, 
				  convertCSSValue(value, config.remBaseSize)
				);
			  }

			  return Reflect.set(target, prop, value);
			},

			get(target, prop) {
			  // Intercept setProperty
			  if (prop === 'setProperty') {
				return function(name, value, priority) {
				  if (EXCLUDED_PROPS.includes(name) || typeof value === 'undefined') {
					return target.setProperty(name, value, priority);
				  }

				  // Konversi jika mengandung px
				  if (typeof value === 'string' && /\dpx\b/.test(value)) {
					value = convertCSSValue(value, config.remBaseSize);
				  }
				  return target.setProperty(name, value, priority);
				}
			  }

			  return Reflect.get(target, prop);
			}
		  });
		},
		configurable: true,
		enumerable: originalStyleDescriptor.enumerable
	  });

	  // 5. Flag aktivasi
	  window.__RDS_PROXY_ACTIVE__ = true;

	  if (config.debug) {
		console.log('%cRDS: Style Proxy Activated', 'color: #4CAF50; font-weight: bold;');
	  }
	};
	
	  /**
     * Nonaktifkan proxy
     */
    const disableStyleProxy = () => {
        if (!isProxyEnabled || !originalStyleDescriptor) return;
        Object.defineProperty(HTMLElement.prototype, 'style', originalStyleDescriptor);
        isProxyEnabled = false;
    };

	// --- API Publik ---
	return {
		/**
		 * Inisialisasi RDS
		 */
		init: (userConfig = {}) => {
			// Handle fallback dari `breakpoint` tunggal pengguna jika ada (menjaga kompatibilitas konfigurasi lama)
			if (userConfig.breakpoint && !userConfig.breakpoints) {
				userConfig.breakpoints = { 
					mobile: userConfig.breakpoint, 
					tablet: 1024 
				};
			}

			// Deep merge konfigurasi
			config = deepMerge({
				...defaultConfig
			}, userConfig);

			// Konversi seluruh CSS ke REM jika diaktifkan
			if (config.remMode !== 'static') {
				convertAllStylesheetsToRem(config.remBaseSize);
				observeDOMChanges();
				enableStyleProxy(); 
			}
			
			if (config.autoConvertJS && config.remMode !== 'static') {
			  enableStyleProxy();
			}

			// Terapkan konfigurasi valid
			config.desktop = deepMerge({
				...defaultConfig.desktop
			}, config.desktop);
			config.tablet = deepMerge({         // Diperbarui: Proses inisialisasi opsi mode tablet
				...defaultConfig.tablet
			}, config.tablet);
			config.mobile = deepMerge({
				...defaultConfig.mobile
			}, config.mobile);

			// Tentukan mode awal
			currentMode = determineMode();
			document.body.setAttribute('data-rds-mode', currentMode);

			// Setup event listeners
			window.addEventListener('resize', handleEvent);
			window.addEventListener('orientationchange', handleEvent);

			// Panggil update awal
			update();

			if (config.debug) {
				console.log('%cRDS Initialized', 'color: #4CAF50; font-weight: bold;');
				console.log('Configuration:', config);
			}
		},

		/**
		 * Memperbarui konfigurasi
		 */
		updateConfig: (newConfig) => {
			if (newConfig.breakpoint && !newConfig.breakpoints) {
				newConfig.breakpoints = { mobile: newConfig.breakpoint, tablet: 1024 };
			}
			config = deepMerge(config, newConfig);
			handleEvent();

			if (config.debug) {
				console.log('%cRDS Configuration Updated', 'color: #2196F3; font-weight: bold;');
			}
		},

		/**
		 * Mengatur mode secara manual
		 */
		setMode: (mode) => {
			// Diperbarui: Mode manual sekarang mendukung tablet
			if (['auto', 'desktop', 'tablet', 'mobile'].includes(mode)) {
				config.forceMode = mode;
				handleEvent();

				if (config.debug) {
					console.log(`%cRDS: Mode set to ${mode}`, 'color: #9C27B0; font-weight: bold;');
				}
			} else {
				console.error('RDS: Invalid mode specified. Use "auto", "desktop", "tablet", or "mobile".');
			}
		},

		/**
		 * Menghentikan RDS dan membersihkan resource
		 */
		destroy: () => {
			window.removeEventListener('resize', handleEvent);
			window.removeEventListener('orientationchange', handleEvent);
			document.documentElement.style.removeProperty(config.cssVarName);
			document.body.removeAttribute('data-rds-mode');
			
			disableStyleProxy();

			if (remConversionObserver) {
				remConversionObserver.disconnect();
				remConversionObserver = null;
			}

			if (config.debug) {
				console.log('%cRDS Destroyed', 'color: #F44336; font-weight: bold;');
			}
		},

		getScale: () => currentScale,
		getConfig: () => ({
			...config
		}),
		getCurrentMode: () => currentMode,

		/**
		 * Konversi nilai CSS untuk kalkulasi real-time
		 */
		unit: (value) => {
			if (value == null || value === '') return '';

			// Jika angka murni
			if (typeof value === 'number') {
				if (config.remMode !== 'static') {
					return `calc(${(value / config.remBaseSize)}rem * var(${config.cssVarName}))`;
				}
				return `calc(${value}px * var(${config.cssVarName}))`;
			}

			if (typeof value === 'string') {
				// Cegah konversi berulang jika sudah memiliki rds scale variable
				if (value.includes(`var(${config.cssVarName})`)) return value;

				// Ganti semua px, rem, em, dengan formula calc scaling
				return value.replace(/(?:url\(['"]?[^)]*?['"]?\))|([-+]?\d*\.?\d+)(px|rem|em)\b/gi, (match, num, unitType) => {
					if (!num) return match; // Abaikan jika ini adalah url()
					return `calc(${num}${unitType} * var(${config.cssVarName}))`;
				});
			}

			return value;
		},

		/**
		 * Terapkan style dengan konversi otomatis
		 */
		applyStyles: (element, styles) => {
			const converted = {};
			const unitProps = [
				'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
				'top', 'bottom', 'left', 'right', 'inset',
				'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
				'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
				'border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
				'borderWidth', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
				'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
				'fontSize', 'lineHeight', 'letterSpacing',
				'gap', 'rowGap', 'columnGap',
				'flexBasis', 'transformOrigin',
				'boxShadow', 'textShadow', 'transform'
			];

			// Reference issue diselesaikan dengan callback jika dibutuhkan context global
			for (const [prop, value] of Object.entries(styles)) {
				if (value == null) continue;

				// Konversi hanya untuk properti yang relevan
				if (unitProps.includes(prop)) {
					// Kita tidak perlu this jika API function `unit` terbuka dari module tapi untuk keamanan pakai yang ini:
					converted[prop] = RDS.unit(value);
				} else {
					converted[prop] = value;
				}
			}

			Object.assign(element.style, converted);
		},

		/**
		 * Terapkan style ke banyak elemen sekaligus
		 */
		applyStylesToAll: (elements, styles) => {
			const elementsArray = Array.from(elements);
			elementsArray.forEach(el => RDS.applyStyles(el, styles));
		},

		/**
		 * Konversi nilai px ke rem
		 */
		pxToRem: (value, base) => {
			let baseSize = base || config.remBaseSize;
			let pxValue = typeof value === 'string' ?
				parseFloat(value.replace('px', '')) :
				value;

			const remValue = pxValue / baseSize;
			const formatted = parseFloat(remValue.toFixed(4));
			return `${formatted}rem`;
		},

		/**
		 * Konversi nilai rem ke px
		 */
		remToPx: (value, base) => {
			let baseSize = base || config.remBaseSize;
			let remValue = typeof value === 'string' ?
				parseFloat(value.replace('rem', '')) :
				value;

			const pxValue = remValue * baseSize;
			return `${pxValue}px`;
		},

		/**
		 * Versi khusus pxToRem untuk konversi langsung ke format responsif
		 */
		responsivePx: (value, base) => {
			const remValue = RDS.pxToRem(value, base);
			return RDS.unit(remValue);
		},

		/**
		 * Konversi seluruh CSS di halaman ke REM
		 */
		convertAllToRem: (base = 16) => {
			convertAllStylesheetsToRem(base);
			observeDOMChanges();
			return true;
		}
	};
})();


export {RDS}