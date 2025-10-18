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
		mobile: {
			baseWidth: 375,
			baseHeight: 667,
			minScale: 0.2,
			maxScale: 1.2
		},
		baseFontSize: '16px',
		breakpoint: 768,
		forceMode: 'auto', // 'auto', 'desktop', 'mobile'
		debug: true,
		autoConvertJS: true, // Tambah opsi baru
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
	 * Mengonversi nilai CSS px ke rem
	 */
	const convertCSSValue = (value, base) => {
		if (!value) return value;

		return value.replace(/(\d*\.?\d+)px/g, (match, pxValue) => {
			if (parseFloat(pxValue) === 0) return '0';

			const remValue = pxValue / base;
			const formatted = parseFloat(remValue.toFixed(4));
			return formatted === 0 ? '0' : `${formatted}rem`;
		});
	};

	/**
	 * Mengonversi seluruh stylesheet ke rem
	 */
	const convertAllStylesheetsToRem = (base) => {
		// 1. Konversi style sheets
		Array.from(document.styleSheets).forEach(sheet => {
			if (!sheet.href || sheet.href.startsWith(window.location.origin)) {
				try {
					Array.from(sheet.cssRules).forEach(rule => {
						if (rule.type === CSSRule.STYLE_RULE) {
							const style = rule.style;
							for (let i = 0; i < style.length; i++) {
								const prop = style[i];
								const value = style.getPropertyValue(prop);
								const priority = style.getPropertyPriority(prop);

								const convertedValue = convertCSSValue(value, base);
								style.setProperty(prop, convertedValue, priority);
							}
						}
					});
				} catch (e) {
					if (config.debug) {
						console.warn('RDS: Could not process stylesheet', sheet.href, e);
					}
				}
			}
		});

		// 2. Konversi inline styles
		document.querySelectorAll('[style]').forEach(el => {
			const style = el.getAttribute('style');
			el.setAttribute('style', convertCSSValue(style, base));
		});

		// 3. Konversi style tags
		document.querySelectorAll('style').forEach(styleTag => {
			styleTag.textContent = convertCSSValue(styleTag.textContent, base);
		});
		// 4. Konversi style attributes pada semua elemen di dalam body
		document.querySelectorAll('body [style]').forEach(el => {
			const style = el.getAttribute('style');
			el.setAttribute('style', convertCSSValue(style, base));
		});
		// 5. Konversi style tags di dalam body
		document.querySelectorAll('body style').forEach(styleTag => {
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
		return window.innerWidth < config.breakpoint ? 'mobile' : 'desktop';
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
	 * Observasi perubahan DOM untuk konversi style baru
	 */
	const observeDOMChanges = () => {
    if (remConversionObserver) remConversionObserver.disconnect();
    remConversionObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Penanganan untuk node yang ditambahkan
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Tangani elemen baru dengan inline style
                        if (node.hasAttribute('style')) {
                            const style = node.getAttribute('style');
                            node.setAttribute('style', convertCSSValue(style, config.remBaseSize));
                        }
                        
                        // Tangani style tags baru
                        if (node.tagName === 'STYLE') {
                            node.textContent = convertCSSValue(node.textContent, config.remBaseSize);
                        }
                        
                        // Tangani elemen di dalam node yang ditambahkan (deep)
                        node.querySelectorAll('[style]').forEach(el => {
                            const style = el.getAttribute('style');
                            el.setAttribute('style', convertCSSValue(style, config.remBaseSize));
                        });
                        
                        node.querySelectorAll('style').forEach(styleTag => {
                            styleTag.textContent = convertCSSValue(styleTag.textContent, config.remBaseSize);
                        });
                    }
                });
            }
            
            // Penanganan untuk perubahan atribut style
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                const style = target.getAttribute('style');
                target.setAttribute('style', convertCSSValue(style, config.remBaseSize));
            }
        });
    });
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

	  // 3. Daftar properti yang tidak dikonversi
	  const EXCLUDED_PROPS = ['zIndex', 'zoom', 'flex', 'flexGrow', 'flexShrink', 'opacity', 'order'];

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
			if (['auto', 'desktop', 'mobile'].includes(mode)) {
				config.forceMode = mode;
				handleEvent();

				if (config.debug) {
					console.log(`%cRDS: Mode set to ${mode}`, 'color: #9C27B0; font-weight: bold;');
				}
			} else {
				console.error('RDS: Invalid mode specified. Use "auto", "desktop", or "mobile".');
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
		 * Konversi nilai CSS
		 */
		unit: (value) => {
			if (value == null) return '';

			// Skip untuk nilai khusus
			if (typeof value === 'string') {
				if (/(calc|var|env)\(|%|vw|vh|vmin|vmax|deg|rad|turn|grad|fr|s|ms|Hz|kHz|dpi|dpcm|dppx/.test(value)) {
					return value;
				}
			}

			// Konversi ke rem jika dalam mode REM
			if (config.remMode !== 'static' && typeof value === 'number') {
				const remValue = value / config.remBaseSize;
				return `calc(${remValue}rem * var(${config.cssVarName}))`;
			}

			// Default: gunakan sistem scaling biasa
			if (typeof value === 'number') {
				return `calc(${value}px * var(${config.cssVarName}))`;
			}

			// Penanganan khusus untuk fungsi transform
			if (typeof value === 'string' && value.includes('translate')) {
				return value.replace(/(translate[XY]?\([^)]+\))/g, (translateFn) => {
					return translateFn.replace(/(-?\d*\.?\d+)\s*(px|rem|em)\b/g, (match, number, unit) => {
						return `calc(${number}${unit} * var(${config.cssVarName}))`;
					});
				});
			}

			// Penanganan khusus untuk box-shadow
			if (typeof value === 'string' && value.includes('box-shadow')) {
				return value.replace(/(\d+px)/g, (size) => {
					const number = parseFloat(size);
					return `calc(${number}px * var(${config.cssVarName}))`;
				});
			}

			// Konversi umum
			return value.split(/\s+/).map(part => {
				const match = part.match(/^(-?\d*\.?\d+)(px|rem|em)$/);
				if (match) {
					return `calc(${match[1]}${match[2]} * var(${config.cssVarName}))`;
				}
				return part;
			}).join(' ');
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

			for (const [prop, value] of Object.entries(styles)) {
				if (value == null) continue;

				// Konversi hanya untuk properti yang relevan
				if (unitProps.includes(prop)) {
					converted[prop] = this.unit(value);
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
			elementsArray.forEach(el => this.applyStyles(el, styles));
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
			const remValue = this.pxToRem(value, base);
			return this.unit(remValue);
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