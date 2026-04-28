import tkinter as tk
from tkinter import scrolledtext
import threading
import time
import re
import os
import base64
from PIL import ImageDraw, ImageFont


from llm_client import LMStudioClient
from pc_controller import PCController
from vision_pipeline import VisionPipeline

# ─────────────────────────────────────────────────────────────────────────────
# Regex deteksi tag aksi
# ─────────────────────────────────────────────────────────────────────────────
_SCREENSHOT_RE   = re.compile(r'<TAKE_SCREENSHOT\s*/?>', re.IGNORECASE)
_OPEN_CMD_RE     = re.compile(r'<OPEN_CMD\s*/?>', re.IGNORECASE)
_CLICK_RE        = re.compile(r"<CLICK\s+x=[\"'](?P<x>\d+)[\"']\s+y=[\"'](?P<y>\d+)[\"']\s*/?>", re.IGNORECASE)
_DBLCLICK_RE     = re.compile(r"<DOUBLE_CLICK\s+x=[\"'](?P<x>\d+)[\"']\s+y=[\"'](?P<y>\d+)[\"']\s*/?>", re.IGNORECASE)
_RCLICK_RE       = re.compile(r"<RIGHT_CLICK\s+x=[\"'](?P<x>\d+)[\"']\s+y=[\"'](?P<y>\d+)[\"']\s*/?>", re.IGNORECASE)
_SCROLL_RE       = re.compile(r"<SCROLL\s+x=[\"'](?P<x>\d+)[\"']\s+y=[\"'](?P<y>\d+)[\"']\s+amount=[\"'](?P<amt>-?\d+)[\"']\s*/?>", re.IGNORECASE)
_TYPE_RE         = re.compile(r"<TYPE\s+text=[\"'](?P<text>[^\"']+)[\"']\s*/?>", re.IGNORECASE)
_CLEAR_TYPE_RE   = re.compile(r"<CLEAR_TYPE\s+text=[\"'](?P<text>[^\"']+)[\"']\s*/?>", re.IGNORECASE)
_PRESS_RE        = re.compile(r"<PRESS\s+key=[\"'](?P<key>[^\"']+)[\"']\s*/?>", re.IGNORECASE)
_HOTKEY_RE       = re.compile(r"<HOTKEY\s+keys=[\"'](?P<keys>[^\"']+)[\"']\s*/?>", re.IGNORECASE)
_RUN_APP_RE      = re.compile(r"<RUN_APP\s+cmd=[\"'](?P<cmd>[^\"']+)[\"']\s*(?:wait=[\"'](?P<wait>\d+(?:\.\d+)?)[\"'])?\s*/?>", re.IGNORECASE)
_RUN_CMD_RE      = re.compile(r"<RUN_CMD\s+cmd=[\"'](?P<cmd>[^\"']+)[\"']\s*/?>", re.IGNORECASE)

# ─────────────────────────────────────────────────────────────────────────────
# System prompt
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """
Kamu adalah asisten pengoperasi Windows 10.
Kamu bisa mengendalikan PC lewat mouse, keyboard, dan CMD.
Gunakan bahasa Indonesia santai sehari-hari.

═══════════════════════════════════════════════════
DAFTAR TOOL YANG BISA KAMU PAKAI UNTUK AKSI (PILIH YANG TEPAT)
═══════════════════════════════════════════════════
1. <TAKE_SCREENSHOT />
   → Dapatkan tangkapan layar saat ini beserta seluruh elemen yang terdeteksi.
   • Gambar 1: Screenshot layar penuh (maks lebar 1024px) yang dilengkapi **Grid Koordinat Global** (garis abu-abu per 100px dengan label angka kuning) untuk membantu menentukan target area kosong (seperti Notepad).
   • Gambar Berikutnya: Potongan gambar mungil (crops) dari teks atau objek yang terdeteksi.
   • Kamu juga akan diberikan daftar teks/elemen yang terdeteksi di layar beserta koordinat (X, Y) ASLI-nya.
   • Gunakan data koordinat/grid yang diberikan untuk langsung melakukan aksi <CLICK x='X' y='Y' />!


2. <CLICK x='X' y='Y' />
   → Klik kiri mouse di posisi (X, Y).
   • Ambil X dan Y langsung dari daftar koordinat setiap elemen yang terdeteksi!

3. <DOUBLE_CLICK x='X' y='Y' />
   → Double-click mouse di (X, Y).
   • Ambil X dan Y langsung dari daftar koordinat setiap elemen yang terdeteksi!

4. <RIGHT_CLICK x='X' y='Y' />
   → Klik kanan mouse di (X, Y).
   • Ambil X dan Y langsung dari daftar koordinat setiap elemen yang terdeteksi!

5. <RUN_APP cmd='perintah' wait='detik' />
   → Jalankan aplikasi (Contoh: <RUN_APP cmd='test_buttons.html' wait='3' />).

6. <TYPE text='teks' />
   → Ketik teks di field yang aktif.

7. <CLEAR_TYPE text='teks' />
   → Hapus isi field lalu ketik teks baru.

8. <PRESS key='tombol' />
   → Tekan satu tombol (enter, tab, backspace, dll).

9. <HOTKEY keys='ctrl+t' />
   → Tekan tombol kombinasi.

═══════════════════════════════════════════════════
ATURAN KERJA
═══════════════════════════════════════════════════
• SATU RESPONS = SATU TAG AKSI. Jangan gabung beberapa aksi sekaligus.
• Pahami percakapan dengan baik sebelum melakukan aksi, apakah percakapan biasa atau perintah aksi, CONTOH:
  • jika percakapan adalah perintah, maka berikan aksi.
  • jika percakapan adalah percakapan biasa atau berupa sapaan atau hal lain yang tidak memerlukan aksi, maka berikan respons berupa percakapan biasa.
• Jangan gunakan tool jika tidak diperlukan, gunakan sesuai fungsinya.
• Kamu harus bisa menentukan apa yang harus kamu lakukan, CONTOH:
pengguna meminta kamu menulis di notepad, maka langkah seharusnya:
1. <RUN_APP cmd='notepad.exe' wait='3' />
2. Berikan percakapan kepada pengguna tentang apa yang sedang kamu lakukan dan apa yang akan kamu lakukan selanjutnya sebelum melakukan aksi selanjutnya.
3. Pastikan notepad sudah terbuka sebelum melakukan aksi selanjutnya
4. Fokuskan jendela Notepad (jika cursor mouse berada di elemen lain, segera klik di area kosong Notepad untuk fokus)
5. Berikan percakapan kepada pengguna tentang apa yang sedang kamu lakukan dan apa yang akan kamu lakukan selanjutnya sebelum melakukan aksi selanjutnya.
6. Mulai menulis dengan tool <TYPE text='teks' />
7. Berikan percakapan kepada pengguna tentang apa yang sedang kamu lakukan dan apa yang akan kamu lakukan selanjutnya sebelum melakukan aksi selanjutnya.
8. Lalu tekan <PRESS key='f11' /> untuk menyimpan
9. Berikan percakapan kepada pengguna tentang apa yang sedang kamu lakukan dan apa yang akan kamu lakukan selanjutnya sebelum melakukan aksi selanjutnya.
10. Jika sudah selesai beritahu pengguna bahwa tugas selesai dan tunggu instruksi selanjutnya.
Terapkan contoh di atas dengan logika yang sama untuk setiap perintah yang diberikan pengguna, dalam setiap langkah berikan respons berupa screenshot kondisi layar saat ini, jangan sampai melangkah lebih dari 1 langkah dalam setiap respons.
• Berikan percakapan kepada pengguna tentang apa yang sedang kamu lakukan dan apa yang akan kamu lakukan selanjutnya sebelum melakukan aksi selanjutnya.
Peringatan Sistem: Tidak menaati ATURAN KERJA atau bertindak sembarangan akan menyebabkan kegagalan sistem.
"""




class SimpleAIAssistant:
    def __init__(self, root):
        self.root = root
        self.root.title("VE - Sahabat AI Minimalis")
        self.root.geometry("660x540")
        self.root.configure(bg="#1e1e2e")

        self.llm = LMStudioClient()
        self.vision = VisionPipeline()
        self.create_widgets()

    # ─────────────────────────────────────────────────────────
    # UI
    # ─────────────────────────────────────────────────────────

    def create_widgets(self):
        header = tk.Label(
            self.root,
            text="VE: Tangan, Mata, dan CMD",
            font=("Helvetica", 14, "bold"),
            bg="#1e1e2e",
            fg="#cba6f7"
        )
        header.pack(pady=10)

        self.display = scrolledtext.ScrolledText(
            self.root,
            wrap=tk.WORD,
            font=("Helvetica", 10),
            bg="#181825",
            fg="#cdd6f4",
            state="disabled"
        )
        self.display.pack(padx=15, pady=10, fill=tk.BOTH, expand=True)

        bottom_frame = tk.Frame(self.root, bg="#1e1e2e")
        bottom_frame.pack(padx=15, pady=10, fill=tk.X)

        self.entry = tk.Entry(
            bottom_frame,
            font=("Helvetica", 11),
            bg="#313244",
            fg="#cdd6f4",
            insertbackground="white",
            border=0
        )
        self.entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=8, padx=(0, 10))
        self.entry.bind("<Return>", lambda e: self.start_processing())

        self.reset_btn = tk.Button(
            bottom_frame,
            text="Reset",
            font=("Helvetica", 10, "bold"),
            bg="#f38ba8",
            fg="#11111b",
            activebackground="#eba0ac",
            border=0,
            cursor="hand2",
            command=self.reset_chat
        )
        self.reset_btn.pack(side=tk.RIGHT, ipadx=12, ipady=5, padx=(5, 0))

        self.send_btn = tk.Button(
            bottom_frame,
            text="Send",
            font=("Helvetica", 10, "bold"),
            bg="#a6e3a1",
            fg="#11111b",
            activebackground="#89b4fa",
            border=0,
            cursor="hand2",
            command=self.start_processing
        )
        self.send_btn.pack(side=tk.RIGHT, ipadx=15, ipady=5)

    def log(self, message: str):
        self.display.configure(state="normal")
        self.display.insert(tk.END, message + "\n")
        self.display.see(tk.END)
        self.display.configure(state="disabled")

    def reset_chat(self):
        self.llm.clear_history()
        self.log("🔄 [Sistem] Percakapan direset. Sesi baru dimulai!")

    # ─────────────────────────────────────────────────────────
    # PROSES UTAMA
    # ─────────────────────────────────────────────────────────

    def start_processing(self):
        user_prompt = self.entry.get().strip()
        if not user_prompt:
            return
        self.entry.delete(0, tk.END)
        self.log(f"👤 Kamu: {user_prompt}")
        self.send_btn.configure(state="disabled")
        self.reset_btn.configure(state="disabled")
        threading.Thread(target=self.process_ai, args=(user_prompt,), daemon=True).start()

    def _screenshot_and_respond(self, context_msg: str) -> str:
        """Deteksi objek secara lokal (OCR/YOLO), kirim koordinat & crop ke LLM."""
        self.log("📸 [Sistem] Menganalisa layar secara lokal...")
        time.sleep(0.5)
        
        base64_images = []
        
        # 1. Ambil screenshot layar penuh dan resize ke lebar maksimal 1024
        mouse_x, mouse_y = 0, 0
        try:
            import pyautogui
            from io import BytesIO
            
            # Ambil screenshot
            full_screenshot = pyautogui.screenshot()
            w, h = full_screenshot.size
            
            # Ambil posisi mouse dan gambar di screenshot sebelum resize
            mouse_x, mouse_y = pyautogui.position()
            draw = ImageDraw.Draw(full_screenshot)
            
            try:
                font = ImageFont.load_default()
            except:
                font = None
                
            # --- GAMBAR GRID KOORDINAT (Per 100px) ---
            # Garis vertikal & label X
            for x_line in range(100, w, 100):
                draw.line([(x_line, 0), (x_line, h)], fill=(128, 128, 128), width=1)
                draw.text((x_line + 5, 5), str(x_line), fill="yellow", font=font)
                draw.text((x_line + 5, h - 20), str(x_line), fill="yellow", font=font)
                
            # Garis horizontal & label Y
            for y_line in range(100, h, 100):
                draw.line([(0, y_line), (w, y_line)], fill=(128, 128, 128), width=1)
                draw.text((5, y_line + 5), str(y_line), fill="yellow", font=font)
                draw.text((w - 40, y_line + 5), str(y_line), fill="yellow", font=font)
                
            # Warna neon/menyala untuk cursor: Merah Terang
            radius = 15
            draw.ellipse((mouse_x - radius, mouse_y - radius, mouse_x + radius, mouse_y + radius), outline="red", width=5)
            draw.ellipse((mouse_x - 5, mouse_y - 5, mouse_x + 5, mouse_y + 5), fill="red")
            draw.text((mouse_x + radius + 5, mouse_y - radius), f"cursor ({mouse_x}, {mouse_y})", fill="red", font=font)

            
            # Resize dengan max width 1024
            if w > 1024:
                new_w = 1024
                new_h = int(h * (1024 / w))
                full_screenshot = full_screenshot.resize((new_w, new_h))
                
            # Convert ke base64
            buffered = BytesIO()
            full_screenshot.save(buffered, format="PNG", quality=85)
            full_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            base64_images.append(full_b64)
            self.log(f"🖼️ [Sistem] Berhasil menyertakan screenshot penuh dengan posisi cursor ({mouse_x}, {mouse_y}).")
            
        except Exception as e:
            self.log(f"⚠️ [Sistem] Gagal memproses screenshot layar penuh: {e}")

            
        # 2. Jalankan OCR untuk menemukan teks/elemen
        ocr_results = self.vision.process_with_ocr()
        
        # 3. Susun daftar deskripsi teks untuk LLM & kumpulkan base64 crops
        detected_text_list = []
        
        # Masukkan SEMUA elemen teks ke dalam list agar LLM bisa memilih koordinat mana saja
        for item in ocr_results:
            desc = f"- '{item['text']}' berada di koordinat ({item['center'][0]}, {item['center'][1]})"
            detected_text_list.append(desc)
            
            # Batasi encode crop image maksimal 10 elemen saja agar tidak meledakkan token
            if len(base64_images) < 11 and os.path.exists(item['crop_path']):
                with open(item['crop_path'], "rb") as image_file:
                    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                    base64_images.append(encoded_string)


                    
        # 3. Gabungkan deskripsi ke prompt konteks
        elemen_str = "\n".join(detected_text_list) if detected_text_list else "Tidak ada elemen teks terdeteksi."
        full_context = (
            f"{context_msg}\n\n"
            f"[INFO LOKAL] Posisi cursor mouse saat ini berada di koordinat: ({mouse_x}, {mouse_y})\n"
            f"Berikut elemen teks yang terdeteksi di layar:\n{elemen_str}\n"
        )

        
        self.log(f"🔍 [VE] Berhasil mendeteksi {len(ocr_results)} elemen.")
        
        response = self.llm.send_prompt(
            full_context,
            base64_image=base64_images if base64_images else None,
            system_prompt=SYSTEM_PROMPT
        )
        self.log(f"🤖 VE: {response}")
        return response

    def process_ai(self, prompt: str):
        try:
            # Kirim pesan awal pengguna, minta AI merencanakan & mulai aksi
            self.log("🤖 VE: Menghubungi LM Studio...")
            response = self.llm.send_prompt(
                prompt,
                base64_image=None,
                system_prompt=SYSTEM_PROMPT
            )
            self.log(f"🤖 VE: {response}")

            MAX_LOOPS = 30
            loop_count = 0

            while loop_count < MAX_LOOPS:
                loop_count += 1

                # ── TAKE_SCREENSHOT ───────────────────────────────────────
                if _SCREENSHOT_RE.search(response):
                    response = self._screenshot_and_respond(
                        "Ini kondisi layar saat ini lewat analisa Local Vision. "
                        "Analisa kembali seluruh elemen yang terdeteksi"
                        "Gunakan grid koordinat crops elemen terdeteksi terlebih dahulu untuk menentukan target elemen, "
                        "Gunakan crops elemen yang terdeteksi jika butuh akurasi koordinat lebih tinggi. "
                        "Ingat kembali apa permintaan awal pengguna?"
                        "Apakah permintaan pengguna sudah tercapai?"
                        "Jika belum, tentukan dengan aksi selanjutnya."
                        "Beritahu pengguna perkembangan terkini dan apa yang akan dilakukan selanjutnya."
                        "Peringatan: Jangan melakukan aksi apapun jika tugas selesai, berhenti dan beritahu pengguna."
                    )
                    continue

                # ── RUN_APP ───────────────────────────────────────────────
                m = _RUN_APP_RE.search(response)
                if m:
                    cmd  = m.group("cmd")
                    wait = float(m.group("wait") or 3.5)
                    self.log(f"🚀 [Aksi] Menjalankan: '{cmd}' (tunggu {wait}s)...")
                    msg = PCController.run_app(cmd, wait_seconds=wait)
                    self.log(f"✅ {msg}")
                    # Tambah jeda ekstra untuk app berat seperti Firefox
                    extra_wait = max(0, wait - 1.0)
                    if extra_wait > 0:
                        time.sleep(extra_wait)
                    response = self._screenshot_and_respond(
                        f"Perintah '{cmd}' sudah dijalankan (menunggu {wait}s). "
                        "Ini kondisi layar sekarang. "
                        "Analisa kembali seluruh elemen yang terdeteksi"
                        "Gunakan grid koordinat crops elemen terdeteksi terlebih dahulu untuk menentukan target elemen, "
                        "Gunakan crops elemen yang terdeteksi jika butuh akurasi koordinat lebih tinggi. "
                        "Ingat kembali apa permintaan awal pengguna?"
                        "Apakah permintaan pengguna sudah tercapai?"
                        "Jika belum, tentukan dengan aksi selanjutnya."
                        "Beritahu pengguna perkembangan terkini dan apa yang akan dilakukan selanjutnya."
                        "Peringatan: Jangan melakukan aksi apapun jika tugas selesai, berhenti dan beritahu pengguna."
                    )
                    continue

                # ── RUN_CMD ───────────────────────────────────────────────
                m = _RUN_CMD_RE.search(response)
                if m:
                    cmd = m.group("cmd")
                    self.log(f"💻 [Aksi] Menjalankan CMD: '{cmd}'...")
                    msg = PCController.run_cmd_command(cmd)
                    self.log(f"✅ {msg}")
                    response = self.llm.send_prompt(
                        f"Perintah CMD '{cmd}' selesai dijalankan.\nHasil:\n{msg}\n\n"
                        "Ingat kembali apa permintaan awal pengguna?"
                        "Apakah permintaan pengguna sudah tercapai?"
                        "Jika belum, tentukan dengan aksi selanjutnya."
                        "Beritahu pengguna perkembangan terkini dan apa yang akan dilakukan selanjutnya."
                        "Peringatan: Jangan melakukan aksi apapun jika tugas selesai, berhenti dan beritahu pengguna.",
                        base64_image=None,
                        system_prompt=SYSTEM_PROMPT
                    )
                    self.log(f"🤖 VE: {response}")
                    continue

                # ── OPEN_CMD ──────────────────────────────────────────────
                if _OPEN_CMD_RE.search(response):
                    self.log("🔧 [Aksi] Membuka jendela CMD...")
                    msg = PCController.open_cmd_and_reset()
                    self.log(f"✅ {msg}")
                    time.sleep(3.5)
                    response = self._screenshot_and_respond(
                        "CMD berhasil dibuka."
                        "Ini screenshot kondisi layar sekarang."
                        "Analisa kembali seluruh elemen yang terdeteksi"
                        "Gunakan grid koordinat crops elemen terdeteksi terlebih dahulu untuk menentukan target elemen, "
                        "Gunakan crops elemen yang terdeteksi jika butuh akurasi koordinat lebih tinggi. "
                        "Ingat kembali apa permintaan awal pengguna?"
                        "Apakah permintaan pengguna sudah tercapai?"
                        "Jika belum, tentukan dengan aksi selanjutnya."
                        "Beritahu pengguna perkembangan terkini dan apa yang akan dilakukan selanjutnya."
                        "Peringatan: Jangan melakukan aksi apapun jika tugas selesai, berhenti dan beritahu pengguna."
                    )
                    continue

                # ── CLICK ─────────────────────────────────────────────────
                m = _CLICK_RE.search(response)
                if m:
                    x, y = int(m.group("x")), int(m.group("y"))
                    self.log(f"🖱️ [Aksi] Klik kiri di ({x}, {y})...")
                    msg = PCController.click(x, y)
                    self.log(f"✅ {msg}")
                    time.sleep(1.2)   # tunggu efek klik
                    response = self._screenshot_and_respond(
                        f"Klik kiri di ({x}, {y}) sudah dilakukan. "
                        "Ini screenshot kondisi layar sekarang."
                        "Analisa kembali seluruh elemen yang terdeteksi"
                        "Gunakan grid koordinat crops elemen terdeteksi terlebih dahulu untuk menentukan target elemen, "
                        "Gunakan crops elemen yang terdeteksi jika butuh akurasi koordinat lebih tinggi. "
                        "Periksa apakah posisi cursor mouse berada di elemen yang seharusnya?"
                        "Jika tidak segera lakukan klik di koordinat elemen yang seharusnya."
                        "Ingat kembali apa permintaan awal pengguna?"
                        "Apakah permintaan pengguna sudah tercapai?"
                        "Jika belum, tentukan dengan aksi selanjutnya."
                        "Beritahu pengguna perkembangan terkini dan apa yang akan dilakukan selanjutnya."
                        "Peringatan: Jangan melakukan aksi apapun jika tugas selesai, berhenti dan beritahu pengguna."
                    )
                    continue

                # ── DOUBLE_CLICK ──────────────────────────────────────────
                m = _DBLCLICK_RE.search(response)
                if m:
                    x, y = int(m.group("x")), int(m.group("y"))
                    self.log(f"🖱️ [Aksi] Double-click di ({x}, {y})...")
                    msg = PCController.double_click(x, y)
                    self.log(f"✅ {msg}")
                    time.sleep(1.5)
                    response = self._screenshot_and_respond(
                        f"Double-click di ({x}, {y}) sudah dilakukan. "
                        "Ini screenshot kondisi layar sekarang."
                        "Analisa kembali seluruh elemen yang terdeteksi"
                        "Gunakan grid koordinat crops elemen terdeteksi terlebih dahulu untuk menentukan target elemen, "
                        "Gunakan crops elemen yang terdeteksi jika butuh akurasi koordinat lebih tinggi. "
                        "Periksa apakah posisi cursor mouse berada di elemen yang seharusnya?"
                        "Jika tidak segera lakukan double klik di koordinat elemen yang seharusnya."
                        "Ingat kembali apa permintaan awal pengguna?"
                        "Apakah permintaan pengguna sudah tercapai?"
                        "Jika belum, tentukan dengan aksi selanjutnya."
                        "Beritahu pengguna perkembangan terkini dan apa yang akan dilakukan selanjutnya."
                        "Peringatan: Jangan melakukan aksi apapun jika tugas selesai, berhenti dan beritahu pengguna."
                    )
                    continue

                # ── RIGHT_CLICK ───────────────────────────────────────────
                m = _RCLICK_RE.search(response)
                if m:
                    x, y = int(m.group("x")), int(m.group("y"))
                    self.log(f"🖱️ [Aksi] Klik kanan di ({x}, {y})...")
                    msg = PCController.right_click(x, y)
                    self.log(f"✅ {msg}")
                    time.sleep(0.8)
                    response = self._screenshot_and_respond(
                        f"Klik kanan di ({x}, {y}) sudah dilakukan. "
                        "Ini screenshot kondisi layar sekarang."
                        "Analisa kembali seluruh elemen yang terdeteksi"
                        "Gunakan grid koordinat crops elemen terdeteksi terlebih dahulu untuk menentukan target elemen, "
                        "Gunakan crops elemen yang terdeteksi jika butuh akurasi koordinat lebih tinggi. "
                        "Periksa apakah posisi cursor mouse berada di elemen yang seharusnya?"
                        "Jika tidak segera lakukan klik kanan di koordinat elemen yang seharusnya."
                        "Ingat kembali apa permintaan awal pengguna?"
                        "Apakah permintaan pengguna sudah tercapai?"
                        "Jika belum, tentukan dengan aksi selanjutnya."
                        "Beritahu pengguna perkembangan terkini dan apa yang akan dilakukan selanjutnya."
                        "Peringatan: Jangan melakukan aksi apapun jika tugas selesai, berhenti dan beritahu pengguna."
                    )
                    continue

                # ── SCROLL ────────────────────────────────────────────────
                m = _SCROLL_RE.search(response)
                if m:
                    x, y, amt = int(m.group("x")), int(m.group("y")), int(m.group("amt"))
                    self.log(f"🖱️ [Aksi] Scroll di ({x}, {y}) amount={amt}...")
                    msg = PCController.scroll(x, y, amt)
                    self.log(f"✅ {msg}")
                    time.sleep(0.8)
                    response = self._screenshot_and_respond(
                        f"Scroll di ({x}, {y}) amount={amt} sudah dilakukan. "
                        "Ini screenshot kondisi layar sekarang."
                        "Analisa kembali seluruh elemen yang terdeteksi"
                        "Gunakan grid koordinat crops elemen terdeteksi terlebih dahulu untuk menentukan target elemen, "
                        "Gunakan crops elemen yang terdeteksi jika butuh akurasi koordinat lebih tinggi. "
                        "Periksa apakah posisi cursor mouse berada di elemen yang seharusnya?"
                        "Jika tidak segera lakukan scroll di koordinat elemen yang seharusnya."
                        "Ingat kembali apa permintaan awal pengguna?"
                        "Apakah permintaan pengguna sudah tercapai?"
                        "Jika belum, tentukan dengan aksi selanjutnya."
                        "Beritahu pengguna perkembangan terkini dan apa yang akan dilakukan selanjutnya."
                        "Peringatan: Jangan melakukan aksi apapun jika tugas selesai, berhenti dan beritahu pengguna."
                    )
                    continue

                # ── CLEAR_TYPE ────────────────────────────────────────────
                m = _CLEAR_TYPE_RE.search(response)
                if m:
                    text = m.group("text")
                    self.log(f"⌨️ [Aksi] Hapus & ketik: '{text}'...")
                    msg = PCController.type_text(text, clear_first=True)
                    self.log(f"✅ {msg}")
                    time.sleep(0.6)
                    response = self._screenshot_and_respond(
                        f"Field dikosongkan lalu teks '{text}' diketikkan. "
                        "Ini screenshot kondisi layar sekarang."
                        "Analisa kembali seluruh elemen yang terdeteksi"
                        "Gunakan grid koordinat crops elemen terdeteksi terlebih dahulu untuk menentukan target elemen, "
                        "Gunakan crops elemen yang terdeteksi jika butuh akurasi koordinat lebih tinggi. "
                        "Ingat kembali apa permintaan awal pengguna?"
                        "Apakah permintaan pengguna sudah tercapai?"
                        "Jika belum, tentukan dengan aksi selanjutnya."
                        "Beritahu pengguna perkembangan terkini dan apa yang akan dilakukan selanjutnya."
                        "Peringatan: Jangan melakukan aksi apapun jika tugas selesai, berhenti dan beritahu pengguna."
                    )
                    continue

                # ── TYPE ──────────────────────────────────────────────────
                m = _TYPE_RE.search(response)
                if m:
                    text = m.group("text")
                    self.log(f"⌨️ [Aksi] Mengetik: '{text}'...")
                    msg = PCController.type_text(text)
                    self.log(f"✅ {msg}")
                    time.sleep(0.5)
                    response = self._screenshot_and_respond(
                        f"Teks '{text}' sudah diketikkan. "
                        "Ini screenshot kondisi layar sekarang."
                        "Analisa kembali seluruh elemen yang terdeteksi"
                        "Gunakan grid koordinat crops elemen terdeteksi terlebih dahulu untuk menentukan target elemen, "
                        "Gunakan crops elemen yang terdeteksi jika butuh akurasi koordinat lebih tinggi. "
                        "Ingat kembali apa permintaan awal pengguna?"
                        "Apakah permintaan pengguna sudah tercapai?"
                        "Jika belum, tentukan dengan aksi selanjutnya."
                        "Beritahu pengguna perkembangan terkini dan apa yang akan dilakukan selanjutnya."
                        "Peringatan: Jangan melakukan aksi apapun jika tugas selesai, berhenti dan beritahu pengguna."
                    )
                    continue

                # ── HOTKEY ────────────────────────────────────────────────
                m = _HOTKEY_RE.search(response)
                if m:
                    keys_str = m.group("keys")          # misal: "ctrl+l"
                    keys = [k.strip() for k in keys_str.split("+")]
                    self.log(f"⌨️ [Aksi] Hotkey: {'+'.join(keys)}...")
                    msg = PCController.hotkey(*keys)
                    self.log(f"✅ {msg}")
                    time.sleep(0.6)
                    response = self._screenshot_and_respond(
                        f"Hotkey '{'+'.join(keys)}' sudah ditekan. "
                        "Ini screenshot kondisi layar sekarang."
                        "Analisa kembali seluruh elemen yang terdeteksi"
                        "Gunakan grid koordinat crops elemen terdeteksi terlebih dahulu untuk menentukan target elemen, "
                        "Gunakan crops elemen yang terdeteksi jika butuh akurasi koordinat lebih tinggi. "
                        "Ingat kembali apa permintaan awal pengguna?"
                        "Apakah permintaan pengguna sudah tercapai?"
                        "Jika belum, tentukan dengan aksi selanjutnya."
                        "Beritahu pengguna perkembangan terkini dan apa yang akan dilakukan selanjutnya."
                        "Peringatan: Jangan melakukan aksi apapun jika tugas selesai, berhenti dan beritahu pengguna."
                    )
                    continue

                # ── PRESS ─────────────────────────────────────────────────
                m = _PRESS_RE.search(response)
                if m:
                    key = m.group("key")
                    self.log(f"⌨️ [Aksi] Tekan tombol: '{key}'...")
                    msg = PCController.press_key(key)
                    self.log(f"✅ {msg}")
                    # Delay lebih panjang untuk tombol yang memicu navigasi (enter, f5, dll)
                    nav_keys = {"enter", "return", "f5", "tab", "escape", "esc"}
                    delay = 2.0 if key.lower() in nav_keys else 0.8
                    time.sleep(delay)
                    response = self._screenshot_and_respond(
                        f"Tombol '{key}' sudah ditekan. "
                        "Ini screenshot kondisi layar sekarang."
                        "Analisa kembali seluruh elemen yang terdeteksi"
                        "Gunakan grid koordinat crops elemen terdeteksi terlebih dahulu untuk menentukan target elemen, "
                        "Gunakan crops elemen yang terdeteksi jika butuh akurasi koordinat lebih tinggi. "
                        "Ingat kembali apa permintaan awal pengguna?"
                        "Apakah permintaan pengguna sudah tercapai?"
                        "Jika belum, tentukan dengan aksi selanjutnya."
                        "Beritahu pengguna perkembangan terkini dan apa yang akan dilakukan selanjutnya."
                        "Peringatan: Jangan melakukan aksi apapun jika tugas selesai, berhenti dan beritahu pengguna."
                    )
                    continue

                # ── Tidak ada tag → selesai ───────────────────────────────
                break

            if loop_count >= MAX_LOOPS:
                self.log("⚠️ [Sistem] Batas maksimal langkah (30) tercapai. Tugas dihentikan.")

        except Exception as e:
            self.log(f"❌ Error: {str(e)}")
        finally:
            self.send_btn.configure(state="normal")
            self.reset_btn.configure(state="normal")


if __name__ == "__main__":
    root = tk.Tk()
    app = SimpleAIAssistant(root)
    root.mainloop()
