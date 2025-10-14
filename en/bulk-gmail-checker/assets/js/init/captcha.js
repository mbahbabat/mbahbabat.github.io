// --- START OF FILE captcha.js ---

/**
 * @fileoverview Modul CAPTCHA Puzzle mandiri yang siap pakai.
 * Menyuntikkan HTML dan CSS sendiri, dan mengembalikan hasil via Promise.
 * @module CaptchaSolver
 */

class CaptchaSolver {
    constructor() {
        this.modal = null;
        this.puzzlePiece = null;
        this.puzzleSlider = null;
        this.puzzleContainer = null;
        this.resolvePromise = null;
        this.rejectPromise = null;

        // Binding metode ke instance ini untuk memastikan 'this' bekerja dengan benar di event listener
        this._handleSliderInput = this._handleSliderInput.bind(this);
        this._handleSliderChange = this._handleSliderChange.bind(this);
    }

    /**
     * Mantra utama untuk memunculkan dan menyelesaikan teka-teki.
     * @param {object} captchaData Data dari server (backgroundImage, puzzlePieceImage, dll.)
     * @param {boolean} isRetry Beri tahu mantra jika ini adalah percobaan ulang setelah gagal.
     * @returns {Promise<number>} Promise yang akan resolve dengan posisi X puzzle saat pengguna berhasil.
     */
    solve(captchaData, isRetry = false) {
        // Hapus modal lama jika ada, untuk memastikan kebersihan
        this._cleanup(); 
        
        // Ciptakan elemen sihir dari ketiadaan
        this._injectCSS();
        this._createModal();

        return new Promise((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;

            // Ambil referensi ke elemen-elemen penting
            this.puzzlePiece = this.modal.querySelector('.captcha-puzzle-piece');
            this.puzzleSlider = this.modal.querySelector('.captcha-slider');
            this.puzzleContainer = this.modal.querySelector('.captcha-puzzle-container');
            const puzzleBackground = this.modal.querySelector('.captcha-puzzle-background');
            const puzzlePieceImage = this.modal.querySelector('.captcha-puzzle-piece-img');
            
            // Atur gambar dan posisi dari data server
            puzzleBackground.src = captchaData.backgroundImage;
            puzzlePieceImage.src = captchaData.puzzlePieceImage;
            this.puzzlePiece.style.top = `${captchaData.puzzleY}px`;

            // Tambahkan event listener dengan metode yang sudah di-bind
            this.puzzleSlider.addEventListener('input', this._handleSliderInput);
            this.puzzleSlider.addEventListener('change', this._handleSliderChange);

            // Tampilkan modal ke dunia
            document.body.appendChild(this.modal);
            
            // Efek muncul yang elegan
            setTimeout(() => {
                this.modal.classList.add('visible');
                // Jika ini adalah percobaan ulang, panggil animasi getaran SEKARANG!
                if (isRetry) {
                    this.triggerFailureAnimation();
                }
            }, 10);
        });
    }

    /**
     * Mantra visual untuk menggerakkan potongan puzzle.
     * @param {Event} event Event 'input' dari slider.
     */
    _handleSliderInput(event) {
        // Slider memiliki max 250, sesuai dengan lebar kontainer (300) dikurangi lebar piece (50)
        this.puzzlePiece.style.left = `${event.target.value}px`;
        
        // Update warna slider berdasarkan nilai
        const value = (event.target.value / event.target.max) * 100;
        event.target.style.background = `linear-gradient(to right, #4CAF50 ${value}%, #d3d3d3 ${value}%)`;
    }

    /**
     * Mantra penentu saat pengguna melepaskan slider.
     * @param {Event} event Event 'change' dari slider.
     */
    _handleSliderChange(event) {
        const userPosition = parseInt(event.target.value, 10);
        this.resolvePromise(userPosition);
        this._cleanup(); // Hancurkan elemen sihir setelah selesai
    }
    
    /**
     * Menampilkan animasi getaran sihir jika jawaban salah.
     */
    triggerFailureAnimation() {
        if (this.puzzleContainer) {
            this.puzzleContainer.classList.add('captcha-puzzle-failed');
            setTimeout(() => {
                this.puzzleContainer.classList.remove('captcha-puzzle-failed');
            }, 500);
        }
    }

    /**
     * Mantra pembersihan untuk melenyapkan semua jejak sihir dari DOM.
     */
    _cleanup() {
        if (this.modal) {
            // Hapus event listener untuk mencegah kebocoran memori
            if(this.puzzleSlider) {
                this.puzzleSlider.removeEventListener('input', this._handleSliderInput);
                this.puzzleSlider.removeEventListener('change', this._handleSliderChange);
            }
            // Lenyapkan modal dari dunia
            this.modal.remove();
            this.modal = null;
        }
        const styleTag = document.getElementById('captcha-styles');
        if (styleTag) {
            styleTag.remove();
        }
    }

    /**
     * Mantra penciptaan untuk memanggil modal CAPTCHA dari alam lain.
     */
    _createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'captcha-modal';
        this.modal.innerHTML = `
            <div class="captcha-modal-content">
                
                <div class="captcha-puzzle-container">
                    <img class="captcha-puzzle-background" alt="Puzzle Background">
                    <div class="captcha-puzzle-piece">
                        <img class="captcha-puzzle-piece-img" alt="Puzzle Piece">
                    </div>
                </div>

                <div class="captcha-slider-container">
					<div class="captcha-instruction-wrapper">
						<p class="captcha-instruction">Drag the slider to fit the puzzle piece</p>
					</div>
                    <input type="range" min="0" max="250" value="0" class="captcha-slider">
                </div>
            </div>
        `;
    }

    /**
     * Mantra gaya untuk menyihir tampilan modal.
     */
    _injectCSS() {
        // Hanya suntikkan jika belum ada
        if (document.getElementById('captcha-styles')) return;

        const style = document.createElement('style');
        style.id = 'captcha-styles';
        style.innerHTML = `
            .captcha-modal {
                display: flex;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .captcha-modal.visible {
                opacity: 1;
            }
            .captcha-modal-content {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: white;
                padding: 1.25rem;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                text-align: center;
            }
            .captcha-puzzle-container {
                position: relative;
                width: 18.75rem;
                height: 9.375rem;
                margin: 1.25rem auto;
                border-radius: 6px;
                overflow: hidden;
            }
            .captcha-puzzle-container.captcha-puzzle-failed {
                animation: captcha-shake 0.5s ease-in-out;
            }
            @keyframes captcha-shake {
                0%, 100% { transform: translateX(0); box-shadow: 0 0 10px rgba(255, 0, 0, 0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
                50% { box-shadow: 0 0 15px rgba(231, 76, 60, 0.8); }
            }
            .captcha-puzzle-background {
                width: 100%;
                height: 100%;
                display: block;
                object-fit: cover;
            }
            .captcha-puzzle-piece {
                position: absolute;
                width: 3.125rem;
                height: 3.125rem;
                left: 0;
                cursor: grab;
            }
            .captcha-puzzle-piece-img {
                width: 100%;
                height: 100%;
                display: block;
            }
            .captcha-slider-container {
                width: 18.75rem;
				height: 1.875rem;
				position: relative;
				display: flex;
				align-items: center;
            }
			.captcha-slider-container:hover{
				.captcha-instruction-wrapper {
					display: none;
				}
			}
			.captcha-instruction-wrapper{
				width: 100%;
				height: 100%;
				display: flex;
				align-items: center;
				position: absolute;
			}
            .captcha-instruction {
                color: #666;
                font-size: 0.688rem;
				margin-left: 2.5rem;
            }
            .captcha-slider {
                width: 100%;
                -webkit-appearance: none;
                height: 1.875rem;
                background: #d3d3d3;
                outline: none;
                opacity: 0.7;
                transition: opacity .2s;
                border-radius: 20px;
                background: linear-gradient(to right, #4CAF50 0%, #d3d3d3 0%);
            }
            .captcha-slider:hover {
                opacity: 1;
            }
            .captcha-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 1.875rem;
                height: 1.875rem;
                background: #fff;
                cursor: pointer;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 5px rgba(0,0,0,0.3);
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234CAF50'%3E%3Cpath d='M10 17l5-5-5-5v10z'/%3E%3C/svg%3E");
                background-size: 50%;
                background-repeat: no-repeat;
                background-position: center;
            }
            .captcha-slider::-moz-range-thumb {
                width: 1.875rem;
                height: 1.875rem;
                background: #fff;
                cursor: pointer;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 5px rgba(0,0,0,0.3);
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234CAF50'%3E%3Cpath d='M10 17l5-5-5-5v10z'/%3E%3C/svg%3E");
                background-size: 50%;
                background-repeat: no-repeat;
                background-position: center;
            }
        `;
        document.head.appendChild(style);
    }
}

// Ekspor instance tunggal (singleton) agar statusnya terjaga
export const captchaSolver = new CaptchaSolver();
// --- END OF FILE captcha.js ---
