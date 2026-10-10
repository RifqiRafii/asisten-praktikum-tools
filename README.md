# 🎓 Asisten Praktikum Tools

> **Sistem Manajemen Penilaian, AI Rubric Drafter, & Rekapitulasi Laboratorium Praktikum Komputer.**

Aplikasi lokal (*single-user*) yang dirancang khusus untuk mempermudah dan mempercepat alur kerja **Asisten Laboratorium Praktikum**. Mulai dari merumuskan rubrik penilaian tugas dari dokumen PDF via AI, mengevaluasi praktikan secara cepat berbasis **klik opsi pencapaian bertingkat (a, b, c)**, hingga menyajikan rekapitulasi nilai kelas matriks per modul dan ekspor ke format Excel CSV.

---

## ✨ Fitur Utama

### 1. 📊 Dashboard Rekapitulasi & Export CSV
- **Matriks Nilai Dinamis:** Menampilkan tabel mahasiswa (NIM, Nama, Kelas) berdampingan dengan kolom seluruh modul praktikum yang aktif.
- **Kartu Statistik Kelas:** Rata-rata nilai kelas, rentang nilai (tertinggi & terendah), total mahasiswa dinilai, serta persentase tingkat kelulusan (&ge; 60 poin).
- **Rincian Catatan Evaluasi:** Klik chip nilai bernomor pada tabel untuk membuka pop-up catatan evaluasi lengkap mahasiswa pada modul tersebut.
- **Pencarian & Filter Instan:** Cari cepat berdasarkan NIM/Nama/Kelas, serta filter status (*Semua, Lulus, Remedial, Belum Dinilai*).
- **Export to CSV (Excel Ready):** Unduh rekapitulasi ke format `.csv` dengan encoding UTF-8 BOM, mencegah angka 0 di depan NIM terpotong dan langsung rapi saat dibuka di Microsoft Excel atau Google Sheets.

### 2. 📝 Form Penilaian Interaktif (Klik-Klik Rubrik)
- **Tanpa Ketik Angka Manual:** Asisten cukup mengklik tombol tingkat pencapaian per instruksi soal:
  - **Opsi a (100%):** Sesuai seluruh ketentuan & instruksi soal.
  - **Opsi b (50%):** Hanya sebagian yang benar atau kurang lengkap.
  - **Opsi c (0%):** Tidak ada yang benar atau tidak dibuat.
- **Kalkulasi Real-Time:** Nilai akhir (skala 0 - 100) dan predikat huruf (A, B, C, D, E) otomatis terkalkulasi seketika.
- **Auto-Generated Feedback:** Kotak evaluasi naratif otomatis terisi ringkasan butir capaian berdasarkan opsi yang diklik.
- **Fast-Grading:** Tombol hijau *"Simpan & Mahasiswa Berikutnya &rarr;"* untuk alur penilaian kilat dari mahasiswa ke mahasiswa berikutnya dalam daftar kelas.

### 3. 📑 Modul & Rubrik Penilaian Terpadu (AI Rubric Drafter)
- **AI Rubric Drafter (Rekomendasi Dokumen/PDF):**
  - Rangkaian prompt khusus yang siap dikirimkan ke AI (ChatGPT / Claude / Gemini) bersama lampiran PDF tugas praktikum.
  - Tanpa copas kode mahasiswa; AI bertugas merumuskan pembobotan dan kriteria penilaian objektif.
  - Kolom **Impor JSON dari AI**: salin blok array JSON dari AI lalu klik *"Simpan Hasil AI"* untuk langsung menyimpannya ke database.
- **Susun Manual & JSON Editor:** Opsi membuat rubrik secara visual row-by-row atau melalui raw JSON.
- **Daftar Rubrik Tersimpan:** Menampilkan seluruh rubrik modul aktif dengan rincian opsi bertingkat dan opsi penghapusan.

### 4. 🏛️ Manajemen Data Master (Multi-Kelas)
- **Struktur Berjenjang:** 1 Mata Kuliah dapat memiliki banyak Kelas (misal: *Kelas A, Kelas B, Kelas F*).
- **Modul Terpusat:** Modul dan rubrik melekat pada Mata Kuliah, sehingga otomatis digunakan bersama oleh seluruh kelas dalam mata kuliah tersebut.
- **Praktikan per Kelas:** Pendaftaran mahasiswa praktikan terikat spesifik pada kelasnya masing-masing.

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend:**
  - [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - [Vite](https://vitejs.dev/) (Build tool kilat)
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [Lucide React](https://lucide.dev/) (Icons)
  - Design System: *Clinical Precision Minimalist* (Sidebar navigasi modern, angka tabular `font-mono`, emerald accents)
- **Backend:**
  - [Node.js](https://nodejs.org/) (ES Modules)
  - [Express.js](https://expressjs.com/) (REST API)
  - [mysql2](https://github.com/sidorares/node-mysql2) (Connection Pool & Promises)
  - [dotenv](https://github.com/motdotla/dotenv) & [cors](https://github.com/expressjs/cors)
- **Database:**
  - MySQL (`asisten_praktikum_db`) via Laragon / XAMPP di `localhost:3306`

---

## 🗄️ Skema Database

```
[ matakuliah ]
      │ (1:N)
      ├───────────────┐
      ▼               ▼
  [ kelas ]       [ modul ]
      │ (1:N)         │ (1:N)
      ▼               ▼
[ praktikan ]     [ rubrik ]
      │               │
      └───────┬───────┘
              ▼
        [ penilaian ]
```

- **`matakuliah`**: `id`, `nama`
- **`kelas`**: `id`, `matakuliah_id`, `nama_kelas`
- **`praktikan`**: `id`, `kelas_id`, `nim`, `nama`
- **`modul`**: `id`, `matakuliah_id`, `judul_modul`
- **`rubrik`**: `id`, `modul_id`, `judul_tugas`, `instruksi_soal`, `kriteria_penilaian` (JSON)
- **`penilaian`**: `id`, `praktikan_id`, `modul_id`, `nilai_angka`, `catatan_evaluasi`, `created_at` (Logika Upsert unik per mahasiswa & modul)

---

## 🚀 Panduan Instalasi & Menjalankan

### Prasyarat
1. **Node.js** (Versi 18 atau lebih baru).
2. **Laragon** atau **XAMPP** dengan service MySQL berjalan di port `3306`.

### 1. Persiapan Database MySQL
Pastikan MySQL di Laragon / XAMPP sudah aktif (*Start All*).
Aplikasi akan otomatis membuat database `asisten_praktikum_db` saat migrasi dijalankan.

### 2. Setup Backend API
Buka terminal dan arahkan ke folder `backend`:
```bash
cd backend
npm install
```

Jalankan script migrasi tabel:
```bash
npm run db:migrate
```

Jalankan backend server:
```bash
npm run dev
```
> Server backend akan aktif di: **`http://localhost:5000`**

### 3. Setup Frontend
Buka tab terminal baru dan arahkan ke folder `frontend`:
```bash
cd frontend
npm install
npm run dev
```
> Antarmuka web akan aktif di: **`http://localhost:5173`**

---

## 📋 Alur Penggunaan Aplikasi (Workflow Asisten)

```
1. Buat Mata Kuliah & Kelas ──► 2. Daftarkan Mahasiswa Praktikan
               │
               ▼
3. Modul & Rubrik Penilaian (AI Drafter bersama PDF Tugas)
               │
               ▼
4. Form Penilaian (Klik Opsi a / b / c per Butir Soal ──► Simpan & Lanjut)
               │
               ▼
5. Dashboard Rekapitulasi (Cek Statistik Kelas ──► Export to CSV Excel)
```

1. **Kelola Data Master:**
   - Masuk ke menu **Mata Kuliah & Kelas** di sidebar, tambahkan mata kuliah (misal: *Pengembangan Aplikasi Web*) dan kelas praktikum (misal: *Kelas A*, *Kelas B*).
   - Masuk ke menu **Daftar Praktikan**, pilih kelas, dan masukkan NIM serta nama mahasiswa.
2. **Siapkan Rubrik Modul:**
   - Masuk ke menu **Modul & Rubrik Penilaian**.
   - Buat judul modul (misal: *Modul 1 - Dasar HTML & CSS*).
   - Pada sub-menu **AI Rubric Drafter**, pilih fokus aspek penilaian, klik **Salin Prompt**, lalu upload file PDF soal tugas praktikum Anda bersama prompt tersebut ke ChatGPT atau Claude.
   - Salin blok kode JSON hasil respons AI, tempelkan ke kolom impor, lalu klik **Simpan Hasil AI ke Rubrik Modul Ini**.
3. **Lakukan Penilaian:**
   - Masuk ke menu **Form Penilaian**.
   - Pilih Mata Kuliah, Kelas, dan Modul yang akan dinilai.
   - Klik nama mahasiswa, lalu cukup **klik Opsi a, b, atau c** pada masing-masing instruksi kriteria.
   - Perhatikan skor akhir dan catatan evaluasi otomatis terisi.
   - Klik tombol hijau **Simpan & Mahasiswa Berikutnya &rarr;** untuk langsung berpindah ke mahasiswa berikutnya.
4. **Rekapitulasi & Ekspor Nilai:**
   - Masuk ke menu **Rekapitulasi & Export**.
   - Lihat matriks nilai kelas, rata-rata, rentang nilai, dan status kelulusan.
   - Klik tombol **Export to CSV** untuk mendapatkan file laporan rekapitulasi nilai siap cetak/setor.

---

## 📁 Struktur Direktori Proyek

```
asisten-praktikum-tools/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # Koneksi MySQL Pool
│   │   ├── routes/
│   │   │   ├── matakuliah.js      # REST API Mata Kuliah
│   │   │   ├── kelas.js           # REST API Multi-Kelas
│   │   │   ├── praktikan.js       # REST API Mahasiswa Praktikan
│   │   │   ├── modul.js           # REST API Modul Praktikum
│   │   │   ├── rubrik.js          # REST API Rubrik Penilaian (JSON)
│   │   │   ├── penilaian.js       # REST API Penilaian (Upsert)
│   │   │   └── rekap.js           # REST API Rekapitulasi Matriks & Statistik
│   │   ├── scripts/
│   │   │   └── migrate.js         # Script Inisialisasi Tabel MySQL
│   │   └── index.js               # Entry point Express Server (Port 5000)
│   ├── .env                       # Konfigurasi Port & DB
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardRekap.tsx          # Matriks Nilai & Export CSV
│   │   │   ├── FormPenilaian.tsx           # Penilaian Klik-Klik Rubrik Bertingkat
│   │   │   ├── ModulRubrikWorkspace.tsx    # Unified AI Drafter & Rubrik Modul
│   │   │   ├── MataKuliahManager.tsx       # Kelola Mata Kuliah & Kelas
│   │   │   └── PraktikanManager.tsx        # Kelola Mahasiswa per Kelas
│   │   ├── services/
│   │   │   └── api.ts             # Service Fetching API Backend
│   │   ├── types/
│   │   │   └── index.ts           # Definisi Type TypeScript
│   │   ├── App.tsx                # Layout Utama dengan Sidebar Navigasi
│   │   ├── main.tsx
│   │   └── index.css              # Styling Tailwind CSS
│   ├── package.json
│   └── vite.config.ts
├── SCHEMA.md                      # Dokumentasi Arsitektur Database MySQL
├── DESIGN.md                      # Design System Tokens & Typography
├── PLAN.md                        # Tracking Roadmap Vertical Slices
└── README.md                      # Dokumentasi Lengkap Proyek
```

---

## 📄 Lisensi
Dibuat untuk memfasilitasi kebutuhan asistensi laboratorium praktikum komputer secara independen dan efisien. Bebas digunakan dan dikembangkan lebih lanjut.
