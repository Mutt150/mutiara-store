<div align="center">

# 🛍️ Mutiara Store
### Modern POS & Store Management System

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

Aplikasi Point of Sale (POS) dan Sistem Manajemen Toko berbasis web yang dirancang khusus untuk kemudahan pemilik UMKM. Kelola kasir, stok gudang, laporan keuangan, hingga manajemen karyawan — semuanya dalam satu antarmuka yang modern, cepat, dan responsif.

[Demo](https://toko-mbg.web.app) · [Laporkan Bug](mailto:mutiara.shabrina250@gmail.com) · [Request Fitur](mailto:mutiara.shabrina250@gmail.com)

</div>

---

## ✨ Fitur Utama

### 🛒 Kasir (Point of Sale)
- **Transaksi Cepat** — Tambah barang ke keranjang via pencarian nama atau scan barcode
- **Dual Mode Scanner** — Mendukung scanner barcode USB dan kamera HP/laptop (Native BarcodeDetector API + fallback ZXing)
- **Manajemen Diskon** — Atur potongan harga per item dengan mudah
- **Multi-Metode Pembayaran** — Cash, QRIS, Transfer, Hutang, dan status pelunasan
- **Cetak Struk/Nota** — Template struk thermal yang otomatis menyesuaikan untuk printer Bluetooth/Thermal

### 📦 Manajemen Gudang (Inventory)
- **Monitoring Stok Real-time** — Pantau sisa stok, peringatan stok menipis, dan stok habis
- **Input Restock** — Catat barang masuk (kulakan) lengkap dengan harga modal dan supplier
- **Kalkulasi HPP Otomatis** — Hitung Harga Pokok Penjualan (Average Cost) secara otomatis
- **Riwayat Masuk** — Lacak jejak penambahan barang beserta total modal yang dikeluarkan

### 💰 Keuangan & Biaya Operasional
- **Biaya per Nota** — Catat pengeluaran spesifik per transaksi (ongkos kirim, parkir, dll.)
- **Biaya Umum Toko** — Catat pengeluaran harian (listrik, gaji, dsb.)
- **Penarikan Modal (Prive)** — Catat pengambilan uang kas oleh pemilik toko

### 📊 Dashboard & Laporan
- **Live Dashboard** — Ringkasan Omzet, Laba Bersih, Nilai Aset Gudang, dan Uang Kas
- **Grafik Penjualan** — Visualisasi tren penjualan 7 hari terakhir
- **Export CSV/Excel** — Unduh rekap transaksi bulanan, seluruh waktu, atau laporan nilai aset gudang

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
| Barcode Scanner | Native BarcodeDetector API + ZXing fallback |
| State Management | React Hooks (useState, useEffect, useMemo) |

---

## 🚀 Instalasi & Menjalankan Aplikasi

### Prasyarat

Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org/) versi 16 atau lebih baru
- Akun [Firebase](https://firebase.google.com/) untuk setup database

### 1. Clone Repository

```bash
git clone https://github.com/username/mutiara-store.git
cd mutiara-store
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Firebase

Buat project di [Firebase Console](https://console.firebase.google.com/), lalu aktifkan:
- **Authentication** (Email/Password & Google)
- **Firestore Database**

Buat file `.env` di root directory dan isi dengan konfigurasi Firebase Anda:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> Nilai-nilai ini dibaca oleh `src/config/firebase.js`.

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di **http://localhost:5173/**

---

## 📂 Struktur Folder

```
mutiara-store/
├── public/                 # Asset statis publik
├── src/
│   ├── assets/             # Gambar, ikon, dll.
│   ├── components/
│   │   ├── layout/         # Sidebar, Navbar
│   │   ├── modals/         # Popup Modal (Edit Order, Connect Store, dll.)
│   │   └── ui/             # Komponen UI Reusable (CameraScanner, Chart, Receipt)
│   ├── config/             # Konfigurasi aplikasi (firebase.js)
│   ├── pages/
│   │   ├── ActivityLog.jsx # Log aktivitas sistem
│   │   ├── Dashboard.jsx   # Halaman beranda utama
│   │   ├── Expenses.jsx    # Manajemen biaya
│   │   ├── History.jsx     # Riwayat transaksi
│   │   ├── Inventory.jsx   # Manajemen gudang & restock
│   │   ├── Login.jsx       # Halaman autentikasi
│   │   ├── Reports.jsx     # Pusat laporan (Export CSV)
│   │   └── Sales.jsx       # Halaman Kasir (POS)
│   ├── utils/              # Fungsi pembantu (helpers.js)
│   ├── App.jsx             # Entry point & routing manual
│   ├── index.css           # Tailwind directives
│   └── main.jsx            # React DOM render point
├── .env                    # Variabel environment (jangan di-commit!)
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🖨️ Pengaturan Printer Thermal (Struk)

Aplikasi menggunakan CSS `@media print` murni — tidak perlu library tambahan.

1. Di halaman **Kasir** atau **Riwayat Nota**, klik tombol **Cetak**
2. Di dialog printer sistem (Chrome/Edge), atur ukuran kertas ke ukuran struk (misal: `58mm` atau `80mm`)
3. **Matikan** opsi *Headers and Footers* agar struk terlihat bersih

---

## 🔒 Firestore Security Rules

Karena data dipisah per toko/user, atur Firestore Rules di Firebase Console:

```js
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

> ⚠️ Rules di atas adalah versi dasar. Untuk **production**, perketat validasi akses antara owner dan staff.

---

## 🤝 Kontribusi

Kontribusi sangat disambut! Jika ingin mengembangkan fitur baru atau memperbaiki bug:

1. **Fork** repository ini
2. Buat branch baru (`git checkout -b fitur/nama-fitur`)
3. Commit perubahan Anda (`git commit -m 'feat: tambah fitur X'`)
4. Push ke branch (`git push origin fitur/nama-fitur`)
5. Buat **Pull Request**

---

## 📄 Lisensi

Hak Cipta © 2026 Mutiara Store. All rights reserved.