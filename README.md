<div align="center">

# 🛍️ Mutiara Store
### Modern POS & Store Management System

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google-bard&logoColor=white)

Aplikasi **Point of Sale (POS)** dan **Sistem Manajemen Toko** berbasis web yang dirancang khusus untuk kemudahan pemilik UMKM. Kelola kasir, stok gudang, laporan keuangan, hingga manajemen karyawan — semuanya dalam satu antarmuka yang modern, cepat, dan responsif.

**[🚀 Lihat Demo](https://toko-mbg.web.app)** · **[🐛 Laporkan Bug](mailto:mutiara.shabrina250@gmail.com)** · **[💡 Request Fitur](mailto:mutiara.shabrina250@gmail.com)**

</div>

---

## 📋 Daftar Isi

- [✨ Fitur Utama](#-fitur-utama)
- [🛠️ Teknologi](#️-teknologi)
- [🚀 Instalasi & Menjalankan Aplikasi](#-instalasi--menjalankan-aplikasi)
- [📂 Struktur Folder](#-struktur-folder)
- [🖨️ Pengaturan Printer Thermal](#️-pengaturan-printer-thermal-struk)
- [🔒 Firestore Security Rules](#-firestore-security-rules)
- [🤝 Kontribusi](#-kontribusi)
- [📄 Lisensi](#-lisensi)

---

## ✨ Fitur Utama

### 🤖 Asisten AI Bisnis — Mutiara AI *(BARU)*

| Fitur | Deskripsi |
|---|---|
| Chatbot Pintar Terintegrasi | Tanya jawab seputar performa toko, sisa stok, laba, dan tips bisnis langsung dengan AI |
| Konteks Real-time | AI otomatis memahami data toko terkini (omzet, stok menipis, barang terlaris, HPP) tanpa input manual |
| Ditenagai Google Gemini | Menggunakan model Gemini 2.5 Flash untuk respons analitis yang cepat dan akurat |
| Riwayat Percakapan | Melanjutkan sesi chat sebelumnya yang tersimpan rapi secara lokal di browser |

---

### 🛒 Kasir (Point of Sale)

- **Transaksi Cepat** — Tambah barang ke keranjang via pencarian nama atau scan barcode
- **Dual Mode Scanner** — Mendukung scanner barcode USB dan kamera HP/laptop (Native BarcodeDetector API + fallback ZXing)
- **Manajemen Diskon** — Atur potongan harga per item dengan mudah
- **Multi-Metode Pembayaran** — Cash, QRIS, Transfer, Hutang, dan status pelunasan
- **Cetak Struk/Nota** — Template struk thermal yang otomatis menyesuaikan untuk printer Bluetooth/Thermal

---

### 📦 Manajemen Gudang (Inventory)

- **Monitoring Stok Real-time** — Pantau sisa stok, peringatan stok menipis, dan stok habis
- **Input Restock** — Catat barang masuk (kulakan) lengkap dengan harga modal dan supplier
- **Kalkulasi HPP Otomatis** — Hitung Harga Pokok Penjualan (Average Cost) secara otomatis
- **Riwayat Masuk** — Lacak jejak penambahan barang beserta total modal yang dikeluarkan

---

### 💰 Keuangan & Biaya Operasional

- **Biaya per Nota** — Catat pengeluaran spesifik per transaksi (ongkos kirim, parkir, dll.)
- **Biaya Umum Toko** — Catat pengeluaran harian (listrik, gaji, dsb.)
- **Penarikan Modal (Prive)** — Catat pengambilan uang kas oleh pemilik toko

---

### 📒 Buku Piutang

- **Tab Khusus Piutang** — Mode tampilan tersendiri di halaman Riwayat yang otomatis menyaring semua transaksi berstatus *Belum Lunas*
- **Kelompok per Pelanggan** — Piutang langsung dikelompokkan berdasarkan nama pelanggan secara otomatis
- **Bayar Lunas Sekali Klik** — Tombol *Bayar Lunas* langsung memperbarui status pembayaran ke database secara real-time

---

### 📊 Dashboard & Laporan

- **Live Dashboard** — Ringkasan Omzet, Laba Bersih, Nilai Aset Gudang, dan Uang Kas
- **Grafik Penjualan** — Visualisasi tren penjualan 7 hari terakhir
- **Barang Terlaris** — 5 produk teratas ditampilkan dalam kartu peringkat bergaya emas, dihitung otomatis berdasarkan total quantity terjual dan diperbarui real-time saat filter bulan/tahun diganti
- **Export CSV/Excel** — Unduh rekap transaksi bulanan, seluruh waktu, atau laporan nilai aset gudang

---

### 👥 Multi-User & Manajemen Tim

- **Mode Bos & Karyawan** — Buat "Alias ID" agar karyawan dapat login dan terhubung ke database toko utama
- **Activity Log** — Catat setiap aksi user (tambah barang, hapus nota, edit profil) untuk meminimalisir kecurangan

---

## 🛠️ Teknologi

| Kategori | Teknologi |
|---|---|
| Frontend Framework | React.js (Vite) |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend & Database | Firebase (Auth + Firestore) |
| AI Integration | Google Gemini API (Gemini 2.5 Flash) |
| Barcode Scanner | Native BarcodeDetector API + ZXing fallback |
| State Management | React Hooks (useState, useEffect, useMemo) |

---

## 🚀 Instalasi & Menjalankan Aplikasi

### Prasyarat

Pastikan sudah terinstal:
- [Node.js](https://nodejs.org/) versi **16 atau lebih baru**
- Akun [Firebase](https://firebase.google.com/) untuk setup database
- API Key dari [Google AI Studio](https://aistudio.google.com/) untuk fitur Mutiara AI

---

### 1. Clone Repository

```bash
git clone https://github.com/username/mutiara-store.git
cd mutiara-store
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Konfigurasi Environment

Buat project di [Firebase Console](https://console.firebase.google.com/), lalu aktifkan:
- **Authentication** (Email/Password & Google)
- **Firestore Database**

Kemudian dapatkan API Key dari [Google AI Studio](https://aistudio.google.com/).

Buat file `.env` di root directory dan isi dengan konfigurasi Anda:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Mutiara AI (Gemini)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **Jangan pernah commit file `.env` ke repository!** Pastikan `.env` sudah ada di `.gitignore`.

Nilai-nilai ini dibaca oleh `src/config/firebase.js` dan `src/pages/ChatbotPage.jsx`.

---

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di **http://localhost:5173/**

---

### 5. Build untuk Production

```bash
npm run build
```

Output build tersimpan di folder `dist/`. Deploy ke Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 📂 Struktur Folder

```
mutiara-store/
├── public/                  # Asset statis publik
├── src/
│   ├── assets/              # Gambar, ikon, dll.
│   ├── components/
│   │   ├── layout/          # Sidebar, Navbar
│   │   ├── modals/          # Popup Modal (Edit Order, Connect Store, dll.)
│   │   └── ui/              # Komponen UI Reusable (CameraScanner, Chart, Receipt)
│   ├── config/
│   │   └── firebase.js      # Konfigurasi Firebase
│   ├── pages/
│   │   ├── ActivityLog.jsx  # Log aktivitas sistem
│   │   ├── ChatbotPage.jsx  # Asisten bisnis cerdas Mutiara AI
│   │   ├── Dashboard.jsx    # Halaman beranda utama
│   │   ├── Expenses.jsx     # Manajemen biaya
│   │   ├── History.jsx      # Riwayat transaksi & Buku Piutang
│   │   ├── Inventory.jsx    # Manajemen gudang & restock
│   │   ├── Login.jsx        # Halaman autentikasi
│   │   ├── Reports.jsx      # Pusat laporan (Export CSV)
│   │   └── Sales.jsx        # Halaman Kasir (POS)
│   ├── utils/
│   │   └── helpers.js       # Fungsi pembantu
│   ├── App.jsx              # Entry point & routing manual
│   ├── index.css            # Tailwind directives
│   └── main.jsx             # React DOM render point
├── .env                     # Variabel environment (jangan di-commit!)
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🖨️ Pengaturan Printer Thermal (Struk)

Aplikasi menggunakan **CSS `@media print` murni** — tidak perlu library tambahan.

1. Di halaman **Kasir** atau **Riwayat Nota**, klik tombol **Cetak**
2. Di dialog printer sistem (Chrome/Edge), atur ukuran kertas ke ukuran struk (misal: `58mm` atau `80mm`)
3. Matikan opsi **Headers and Footers** agar struk terlihat bersih
4. Pilih printer Bluetooth/Thermal yang sudah terhubung ke perangkat

> 💡 **Tips:** Untuk hasil terbaik, gunakan browser **Google Chrome** dan pastikan printer thermal sudah terinstal drivernya.

---

## 🔒 Firestore Security Rules

Karena data dipisah per toko/user, atur Firestore Rules di [Firebase Console](https://console.firebase.google.com/):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /artifacts/{appId}/public/{document=**} {
      // Alias toko bersifat publik agar dapat dicari oleh karyawan
      allow read, write: if request.auth != null;
    }
  }
}
```

> ⚠️ Rules di atas adalah **versi dasar** untuk development. Untuk **production**, perketat validasi akses antara owner dan staff menggunakan `request.auth.uid` dan custom claims.

---

## 🤝 Kontribusi

Kontribusi sangat disambut! Ikuti langkah berikut untuk berkontribusi:

1. **Fork** repository ini
2. Buat branch baru
   ```bash
   git checkout -b fitur/nama-fitur
   ```
3. Commit perubahan Anda
   ```bash
   git commit -m 'feat: tambah fitur X'
   ```
4. Push ke branch
   ```bash
   git push origin fitur/nama-fitur
   ```
5. Buat **Pull Request**

### Konvensi Commit

| Prefix | Penggunaan |
|---|---|
| `feat:` | Menambah fitur baru |
| `fix:` | Memperbaiki bug |
| `refactor:` | Refactor kode tanpa mengubah fungsionalitas |
| `style:` | Perubahan styling/UI |
| `docs:` | Perubahan dokumentasi |
| `chore:` | Update dependencies, config, dll. |

---

## 📄 Lisensi

Hak Cipta © 2026 **Mutiara Store**. All rights reserved.

---

<div align="center">
  Dibuat dengan ❤️ untuk UMKM Indonesia
</div>