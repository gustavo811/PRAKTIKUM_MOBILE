# KasirKu – Aplikasi Kasir POS Berbasis Mobile

Aplikasi mobile kasir modern (**Point of Sale**) yang mengintegrasikan pencatatan pesanan, katalog menu, pembuatan nota transaksi otomatis, dan riwayat penjualan.

Aplikasi ini dibangun menggunakan **React Native + Expo** dengan bahasa **JavaScript** dan penyimpanan lokal **AsyncStorage**, siap dijalankan langsung di smartphone melalui **Expo Go**.

---

## 🌟 Masalah & Solusi yang Diatasi

- **Masalah:**
  1. Pencatatan transaksi manual rawan salah hitung (human-error).
  2. Sulitnya melacak riwayat penjualan dan omset harian secara rapi.
- **Solusi:**
  1. Integrasi kasir digital: Pilih menu, tentukan jumlah & catatan khusus, hitung diskon dan subtotal secara otomatis.
  2. Pembuatan **Nota Digital** bergaya thermal receipt lengkap dengan nama kasir, nomor nota unik, dan fitur **Bagikan Nota** (Share via WhatsApp/Notes).
  3. Pengelolaan katalog menu dan pemantauan stok secara langsung.
  4. Ringkasan omset penjualan dan riwayat transaksi tunai maupun QRIS.

---

## 📱 Core Fitur

### 1. Kasir (Point of Sale)
- Filter kategori menu (*Semua, Makanan, Minuman, Snack, Paket*).
- Kolom pencarian menu real-time.
- Pemilihan produk dengan kontrol kuantitas (+ / -), deteksi batas stok, dan catatan kustom per item (*misal: "Kurang manis", "Pedas"*).
- Floating Bar Keranjang & Drawer Keranjang lengkap.
- Pembayaran fleksibel:
  - **Tunai / Cash**: Tombol pecahan uang cepat (*Uang Pas, Rp 20.000, Rp 50.000, Rp 100.000*), input nominal kustom, dan hitung uang kembalian otomatis.
  - **QRIS / Transfer**: Tampilan barcode QRIS standar nasional dan verifikasi otomatis.
  - Fitur diskon persentase (Normal, 5%, 10%, 15%).

### 2. Nota Digital
- Desain struk belanja digital thermal yang rapi dan elegan.
- Rincian toko, nomor nota unik, tanggal & waktu transaksi, nama kasir, rincian pesanan, subtotal, diskon, grand total, dan metode pembayaran.
- Tombol **Bagikan Nota** menggunakan native Share dialog untuk dikirimkan ke pelanggan via WhatsApp, SMS, dll.

### 3. Katalog Menu & Harga
- Menampilkan seluruh daftar menu beserta harga jual, harga modal, dan sisa stok.
- Tambah menu baru (Nama, Kategori, Harga Jual, Modal, Stok, Deskripsi).
- Edit data menu dan hapus menu dengan dialog konfirmasi.
- Toggle ketersediaan menu secara cepat (*Tersedia / Habis*).

### 4. Riwayat Transaksi & Ringkasan Keuangan
- Ringkasan omset total, total transaksi, total penjualan tunai, dan total QRIS.
- Filter transaksi berdasarkan metode pembayaran (*Semua, Tunai, QRIS*).
- Klik kartu transaksi mana saja untuk membuka kembali **Nota Digital**.

### 5. Otentikasi & Arsitektur Dual-Storage (Secure Storage & Local Storage)
- **Layar Login & Registrasi Akun**:
  - Validasi username dan kata sandi sebelum dapat mengakses sistem kasir.
  - Fitur intip password (show/hide password).
  - Opsi *Ingat Sesi Login* (*Remember Me*).
  - Tombol demo cepat kasir bawaan (*Sarah Amelia*).
  - Registrasi staf baru khusus posisi kasir.
  - Fitur **Logout / Keluar Sesi** langsung dari Header profil kasir.
- **Arsitektur Dual Storage**:
  - 🔐 **Secure Storage (`expo-secure-store`)**: Menyimpan kata sandi, token otentikasi sesi aktif, dan kredensial login terenkripsi secara aman menggunakan hardware Keystore (Android) / Keychain (iOS) dengan fallback yang aman.
  - 💾 **Local Storage (`AsyncStorage`)**: Menyimpan data operasional aplikasi offline seperti katalog produk, transaksi, dan data toko.

---

## 📁 Struktur Folder Proyek

```
Demo Mobile/
├── assets/                  # Icon dan asset visual
├── src/
│   ├── constants/
│   │   ├── initialData.js   # Data awal produk, pekerja, info toko
│   │   └── theme.js         # Sistem warna, tipografi, bayangan (shadow)
│   ├── services/
│   │   ├── storage.js       # Local Storage (AsyncStorage) untuk produk, transaksi & toko
│   │   └── secureStorage.js # Secure Storage (Hardware Keystore/Keychain) untuk auth
│   ├── components/
│   │   ├── Header.js        # Header atas dengan profil kasir & logout
│   │   ├── ProductCard.js   # Kartu produk dengan kontrol jumlah & stok
│   │   ├── CartModal.js     # Drawer keranjang pesanan
│   │   ├── PaymentModal.js  # Modal pembayaran Tunai & QRIS
│   │   └── ReceiptModal.js  # Modal Nota Digital + Fitur Share
│   └── screens/
│       ├── AuthScreen.js    # Layar Autentikasi (Login & Registrasi Kasir)
│       ├── KasirScreen.js   # Layar Kasir POS utama
│       ├── MenuScreen.js    # Layar Manajemen Menu & Harga
│       └── RiwayatScreen.js # Layar Riwayat Transaksi & Ringkasan Omset
├── App.js                   # Navigasi Tab Bottom Bar & State Utama
├── app.json                 # Konfigurasi Expo
├── babel.config.js          # Babel preset Expo
└── package.json             # Dependensi proyek
```

---

## 🚀 Cara Menjalankan di Expo Go (HP Smartphone)

1. **Pastikan HP dan Laptop terhubung ke jaringan Wi-Fi yang sama** (atau hotspot HP).
2. Install aplikasi **Expo Go** di smartphone melalui Google Play Store (Android) atau App Store (iOS).
3. Buka terminal di folder proyek ini (`Demo Mobile`), lalu jalankan perintah:
   ```bash
   npx expo start
   ```
   *(atau `npm start`)*
4. Terminal akan menampilkan **QR Code**:
   - **Android**: Buka aplikasi Expo Go di HP, pilih tombol **"Scan QR code"**, lalu arahkan kamera ke QR code di terminal.
   - **iOS**: Buka aplikasi Kamera bawaan iPhone, arahkan ke QR code, lalu klik banner untuk membuka di Expo Go.
5. Aplikasi **KasirKu** akan langsung terbuka dan siap didemokan!
