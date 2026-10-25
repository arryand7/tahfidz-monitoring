<div align="center">

# 📖 SABIRA TAHFIDZ
### Sistem Informasi Manajemen Hafalan & Murojaah Al-Qur'an Modern

[![Laravel Version](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![PHP Version](https://img.shields.io/badge/PHP-8.2%20|%208.3%20|%208.4-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![React Version](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-2.x-9553E9?style=for-the-badge&logo=inertia&logoColor=white)](https://inertiajs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

<p align="center">
  Aplikasi manajemen tahfidz berbasis web yang dirancang khusus untuk pondok pesantren, sekolah Islam terpadu, dan rumah tahfidz. Mempermudah ustadz mencatat setoran santri secara real-time, mengontrol capaian hafalan, serta mengekspor rekapitulasi nilai dan laporan dalam format PDF & CSV.
</p>

[Fitur Utama](#-fitur-utama) •
[Diagram & Graphify](docs/GRAPHIFY.md) •
[Instalasi](#-panduan-instalasi) •
[Akun Demo](#-akun-demo-default) •
[Struktur Proyek](#-struktur-proyek)

</div>

---

## 🌟 Fitur Utama

- 📊 **Dashboard Interaktif Real-Time**: Statistik harian jumlah santri yang menyetor, perbandingan hafalan baru vs murojaah, dan log 10 aktivitas setoran terkini.
- ✍️ **Input Setoran Cerdas**: Form pencatatan hafalan dengan referensi otomatis 114 Surah Al-Qur'an, batasan ayat, evaluasi nilai (*Baik / Cukup / Kurang*), dan catatan tajwid/tahsin.
- 📁 **Rekapitulasi Setoran Global**: Riwayat seluruh setoran dengan fitur pencarian dan filter interaktif berbasis nama santri atau tanggal.
- 🎓 **Rekap Santri & Ekspor Multi-Format**:
  - **Ekspor PDF**: Halaman laporan formal per santri (*page-break*) siap cetak menggunakan engine DomPDF.
  - **Ekspor CSV**: Lembar data komprehensif kompatibel dengan Microsoft Excel dan Google Sheets.
- 🗂️ **Database Santri & Ustadz**:
  - Manajemen data master (Tambah, Edit, Hapus, Filter Status).
  - Unduh template CSV untuk pengisian cepat.
  - Fitur **Upload Massal (CSV Import)** untuk ribuan data santri/ustadz dalam hitungan detik.
- 📖 **Master Al-Qur'an**: Katalog lengkap 114 Surah bersumber dari data shahih, mencakup nomor urut surah, arti nama surah, jumlah ayat, dan posisi juz.
- ⚙️ **Kelola Pengguna & Generator Akun Massal**:
  - Pembuatan akun otomatis satu kali klik untuk semua santri (username menggunakan NIS) dan ustadz (username menggunakan NIP).
  - Manajemen wewenang pengguna (*Admin*, *Ustadz*, *Siswa*).
- 🛡️ **Sistem Keamanan & Validasi**:
  - Otentikasi berbasis username & kata sandi dengan proteksi *Rate Limiting* (anti-bruteforce).
  - Role-Based Access Control (RBAC) pada level routing dan antarmuka pengguna.
  - Enkripsi password menggunakan algoritma Bcrypt standar industri.

---

## 📊 Visualisasi & Graphify

Dokumentasi diagram visual mendalam mengenai alur bisnis, relasi basis data, dan arsitektur teknis dapat dilihat di:
👉 **[Dokumentasi Graphify & Diagram Arsitektur (docs/GRAPHIFY.md)](docs/GRAPHIFY.md)**

Tersedia diagram interaktif:
1. **Arsitektur Komponen Sistem** (*Modern Monolith with Inertia.js*)
2. **Entity Relationship Diagram (ERD)**
3. **Matriks Hak Akses (RBAC)**
4. **Alur Bisnis Input Setoran**
5. **Alur Pembuatan Akun Otomatis**
6. **Alur Pelaporan & Ekspor Data (PDF & CSV)**
7. **Mesin Status Sesi Autentikasi**

---

## 💻 Kebutuhan Sistem

- **PHP**: Versi `^8.2`, `8.3`, atau `8.4` (Ekstensi aktif: `pdo_sqlite` / `pdo_mysql`, `mbstring`, `openssl`, `gd`, `xml`)
- **Composer**: Versi `2.x`
- **Node.js**: Versi `18.x`, `20.x`, `22.x`, atau `24.x`
- **NPM**: Versi `9.x` ke atas
- **Database**: SQLite (bawaan, zero-configuration) atau MySQL/MariaDB

---

## 🚀 Panduan Instalasi

### 1. Kloning Repositori
```bash
git clone https://github.com/username/sabira-tahfidz.git
cd sabira-tahfidz
```

### 2. Pasang Dependensi Backend (PHP / Composer)
```bash
composer install
```

### 3. Konfigurasi Lingkungan (.env)
Salin berkas konfigurasi template:
```bash
cp .env.example .env
php artisan key:generate
```

> **Catatan Basis Data:** Secara default, aplikasi menggunakan **SQLite** sehingga Anda tidak perlu menginstal server MySQL secara manual. Berkas database berada di `database/database.sqlite`. Jika ingin menggunakan MySQL, ubah `DB_CONNECTION=mysql` dan sesuaikan kredensial di `.env`.

### 4. Migrasi & Seeder Basis Data
Jalankan migrasi tabel beserta data demo dan master 114 surah:
```bash
php artisan migrate:fresh --seed
```

### 5. Pasang Dependensi Frontend & Kompilasi Aset
```bash
npm install
npm run build
```

### 6. Menjalankan Aplikasi
Jalankan server pengembangan Laravel:
```bash
php artisan serve
```
Akses aplikasi melalui browser di **`http://127.0.0.1:8000`**.

Untuk pengembangan frontend aktif dengan *hot-module-replacement (HMR)*:
```bash
npm run dev
```

---

## 🔑 Akun Demo Default

Setelah menjalankan `php artisan migrate:fresh --seed`, akun-akun demo berikut siap digunakan:

| Peran (*Role*) | Username | Password | Deskripsi Wewenang |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Akses penuh (Input setoran, master santri, master ustadz, kelola user, generate akun) |
| **Ustadz** | `19800101` | `sabira123` | Akses operasional (Input setoran santri, lihat rekap, ekspor nilai PDF/CSV) |
| **Siswa / Santri** | `2023001` | `sabira123` | Akses mandiri (Dashboard & melihat rekap setoran hafalan) |

---

## 🛠️ Perintah Berguna (*CLI Commands*)

| Perintah | Deskripsi |
| :--- | :--- |
| `php artisan test` | Menjalankan seluruh rangkaian tes otomatis (*Unit & Feature Tests*) |
| `./vendor/bin/pint` | Memformat kode PHP sesuai standar PSR-12 / Laravel Code Style |
| `npm run dev` | Menjalankan Vite dev server untuk live preview React |
| `npm run build` | Melakukan bundling dan minifikasi aset produksi ke `public/build` |
| `php artisan route:list` | Memeriksa seluruh daftar rute dan middleware yang terdaftar |
| `php artisan optimize:clear` | Membersihkan cache konfigurasi, routing, dan view |

---

## 📁 Struktur Proyek

```
sabira-tahfidz/
├── app/
│   ├── Http/
│   │   ├── Controllers/       # Controller logika bisnis (Setoran, Siswa, Ustadz, dll.)
│   │   ├── Middleware/        # Middleware Inertia & Autentikasi
│   │   └── Requests/          # Form Request Validation (Login, dll.)
│   └── Models/                # Eloquent Models (User, Siswa, Ustadz, Setoran, MasterQuran)
├── database/
│   ├── migrations/            # Skema tabel database
│   └── seeders/               # Data awal (MasterQuranSeeder, DummyDataSeeder)
├── docs/
│   └── GRAPHIFY.md            # Dokumentasi visual arsitektur & diagram Mermaid
├── resources/
│   ├── css/                   # Stylesheet Tailwind CSS
│   ├── js/
│   │   ├── Components/        # Komponen UI React reusable (Button, Modal, Input)
│   │   ├── Layouts/           # Layout utama (AuthenticatedLayout, GuestLayout)
│   │   └── Pages/             # Halaman antarmuka Inertia.js (Dashboard, InputSetoran, dll.)
│   └── views/
│       ├── app.blade.php      # Root Blade template
│       └── pdf/               # Template Blade laporan cetak PDF
├── routes/
│   ├── web.php                # Rute web aplikasi
│   └── auth.php               # Rute autentikasi Laravel Breeze
└── tests/
    ├── Feature/               # Pengujian fungsional modul dan otentikasi
    └── Unit/                  # Pengujian unit
```

---

## 🔒 Keamanan & Kebijakan Privasi

- Jangan pernah mengunggah berkas `.env` asli atau file basis data `database/*.sqlite` ke repositori publik.
- Seluruh rahasia lingkungan telah dimasukkan dalam `.gitignore`.
- Password akun selalu di-hash menggunakan `Hash::make()` dengan algoritma Bcrypt (cost round 12).

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi terbuka [MIT License](LICENSE).
Bebas dimodifikasi dan dikembangkan untuk kebutuhan lembaga pendidikan dan komunitas.
