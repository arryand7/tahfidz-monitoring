# Dokumentasi Graphify & Arsitektur Sistem - Sabira Tahfidz

Dokumen ini menyediakan representasi visual berbasis graf (*graphify*) dan diagram teknis mendalam mengenai arsitektur, basis data, alur bisnis, serta keamanan aplikasi **Sabira Tahfidz**.

---

## 1. Arsitektur Komponen Sistem (*System Architecture*)

Aplikasi menggunakan pola arsitektur **Monolith Modern** (*Modern Monolith*) dengan integrasi **Inertia.js** yang menghubungkan backend Laravel 12 secara langsung ke frontend SPA React 18 tanpa memerlukan API REST konvensional.

```mermaid
graph TB
    subgraph Client ["Client Browser (Desktop & Mobile)"]
        UI["React 18 SPA (Vite + Tailwind CSS)"]
        InertiaClient["@inertiajs/react Adapter"]
        UI --> InertiaClient
    end

    subgraph Server ["Laravel 12 Application Server"]
        Router["Laravel Routing (routes/web.php)"]
        AuthMiddleware["Middleware (auth, verified, InertiaShare)"]
        Controllers["Controllers:
        - DashboardController
        - SetoranController
        - RekapSetoranController
        - RekapSiswaController
        - SiswaController
        - UstadzController
        - MasterQuranController
        - UserController"]
        
        Models["Eloquent ORM Models:
        - User
        - Siswa
        - Ustadz
        - Setoran
        - MasterQuran"]
        
        ExportEngines["Export Engines:
        - Barryvdh DomPDF
        - Native Streamed CSV"]
    end

    subgraph StorageLayer ["Persistence & Storage Layer"]
        DB[(Database: SQLite / MySQL)]
        StorageDisk["Local Disk Storage / Cache"]
    end

    InertiaClient <==>|"Inertia Protocol (JSON & X-Inertia Headers)"| Router
    Router --> AuthMiddleware
    AuthMiddleware --> Controllers
    Controllers --> Models
    Controllers --> ExportEngines
    Models <==>|"Eloquent Query Builder"| DB
    ExportEngines --> Client
    Controllers -.-> StorageDisk
```

---

## 2. Entity Relationship Diagram (ERD)

Struktur data dirancang ternormalisasi dengan referensial integritas (`foreignId` dengan `onDelete('cascade')`).

```mermaid
erDiagram
    USERS {
        bigint id PK
        string name
        string username UK "Digunakan untuk login (NIS / NIP / admin)"
        string email UK
        timestamp email_verified_at
        string password
        string role "Admin | Ustadz | Siswa"
        string status "Aktif | Non-Aktif"
        string remember_token
        timestamp created_at
        timestamp updated_at
    }

    SISWAS {
        bigint id PK
        string nis UK "Nomor Induk Siswa"
        string nama "Nama Lengkap Santri"
        string kelas "Contoh: X-IPA 1"
        string status "Aktif | Non-Aktif"
        timestamp created_at
        timestamp updated_at
    }

    USTADZS {
        bigint id PK
        string nip UK "Nomor Induk Pegawai / Ustadz"
        string nama "Nama Lengkap Ustadz"
        string no_hp "Nomor Kontak / WhatsApp"
        string status "Aktif | Non-Aktif"
        timestamp created_at
        timestamp updated_at
    }

    SETORANS {
        bigint id PK
        bigint ustadz_id FK "Relasi ke ustadzs.id"
        bigint siswa_id FK "Relasi ke siswas.id"
        date tanggal "Tanggal Setoran"
        string jenis "Hafalan | Murojaah"
        string surah "Nama Surah Al-Quran"
        string ayat_awal "Nomor Ayat Awal"
        string ayat_akhir "Nomor Ayat Akhir"
        string nilai "Baik | Cukup | Kurang"
        text catatan "Catatan / Evaluasi Tajwid"
        timestamp created_at
        timestamp updated_at
    }

    MASTER_QURANS {
        bigint id PK "Nomor Urut Surah (1 - 114)"
        string nama_surah "Nama Surah"
        string arti "Arti / Terjemahan Surah"
        int jumlah_ayat "Total Ayat Surah"
        string posisi_juz "Contoh: Juz 1 - 3"
        timestamp created_at
        timestamp updated_at
    }

    SISWAS ||--o{ SETORANS : "memiliki riwayat"
    USTADZS ||--o{ SETORANS : "membimbing & menguji"
    USERS ||..o{ SISWAS : "akun santri (username = nis)"
    USERS ||..o{ USTADZS : "akun ustadz (username = nip)"
```

---

## 3. Matriks Hak Akses & Role-Based Access Control (RBAC)

Sistem membedakan hak akses pengguna menjadi 3 tingkat wewenang (*role*):

```mermaid
graph TD
    classDef admin fill:#059669,stroke:#047857,color:#ffffff;
    classDef ustadz fill:#0284c7,stroke:#0369a1,color:#ffffff;
    classDef siswa fill:#d97706,stroke:#b45309,color:#ffffff;

    User([Pengguna Terautentikasi])

    User -->|Role: Admin| RAdmin[Admin]:::admin
    User -->|Role: Ustadz| RUstadz[Ustadz]:::ustadz
    User -->|Role: Siswa| RSiswa[Siswa / Santri]:::siswa

    subgraph FiturUmum ["Fitur Bersama (Semua Role)"]
        F1["Dashboard Utama"]
        F2["Rekap Setoran Global"]
        F3["Edit Profil Sendiri"]
    end

    subgraph FiturAkademik ["Fitur Pembimbing (Admin & Ustadz)"]
        F4["Input Setoran Hafalan / Murojaah"]
        F5["Rekap Siswa & Ekspor Laporan"]
        F6["Cetak PDF & CSV (Per Santri / Keseluruhan)"]
    end

    subgraph FiturMaster ["Fitur Master Data (Admin Saja)"]
        F7["Kelola Database Santri (CRUD & CSV Import)"]
        F8["Kelola Database Ustadz (CRUD & CSV Import)"]
        F9["Master Al-Quran 114 Surah"]
        F10["Kelola Akun User & Auto-Generator Akun"]
    end

    RAdmin --> FiturUmum
    RAdmin --> FiturAkademik
    RAdmin --> FiturMaster

    RUstadz --> FiturUmum
    RUstadz --> FiturAkademik

    RSiswa --> FiturUmum
```

---

## 4. Alur Bisnis Input Setoran (*Hafalan & Murojaah Flow*)

Proses pencatatan setoran hafalan baru atau murojaah oleh Ustadz/Admin:

```mermaid
sequenceDiagram
    autonumber
    actor U as Ustadz / Admin
    participant V as React Form (InputSetoran)
    participant C as SetoranController
    participant M as MasterQuran / Siswa Model
    participant S as Setoran Model
    participant DB as Database

    U->>V: Buka Halaman Input Setoran
    V->>C: GET /input-setoran
    C->>M: Ambil Siswa Aktif & Master Quran (114 Surah)
    M-->>V: Render dropdown Siswa & Surah
    U->>V: Pilih Santri, Jenis (Hafalan/Murojaah), Surah, Ayat, Nilai & Catatan
    U->>V: Klik Simpan Setoran
    V->>C: POST /input-setoran (Payload Validasi)
    C->>C: Validasi Request (siswa_id, surah, ayat, nilai)
    C->>C: Resolusi ID Ustadz (Auth User / NIP / Fallback)
    C->>S: Setoran::create(...)
    S->>DB: INSERT INTO setorans
    DB-->>C: Setoran Berhasil Disimpan
    C-->>V: Redirect ke Dashboard (Inertia Refresh)
    V-->>U: Notifikasi Sukses & Statistik Hari Ini Terupdate
```

---

## 5. Alur Pembuatan Akun Otomatis (*Mass Account Generator*)

Memudahkan administrator membuat akun secara instan untuk seluruh santri (berbasis NIS) dan seluruh ustadz (berbasis NIP) tanpa membuat akun satu per satu:

```mermaid
flowchart TD
    Start([Admin Klik: Generate Akun Otomatis]) --> Req[POST /kelola-user/generate]
    Req --> LoopSiswa[Iterasi Seluruh Siswa di Database]
    
    LoopSiswa --> CheckSiswaUser{Apakah NIS sudah ada di tabel users?}
    CheckSiswaUser -- Belum Ada --> CreateSiswa[User::firstOrCreate<br/>username: NIS<br/>role: Siswa<br/>password: default 'sabira123']
    CheckSiswaUser -- Sudah Ada --> SkipSiswa[Lewati / Pertahankan Akun]
    
    CreateSiswa --> NextSiswa[Lanjut ke Siswa Berikutnya]
    SkipSiswa --> NextSiswa
    
    NextSiswa --> LoopUstadz[Iterasi Seluruh Ustadz yang Memiliki NIP]
    LoopUstadz --> CheckUstadzUser{Apakah NIP sudah ada di tabel users?}
    CheckUstadzUser -- Belum Ada --> CreateUstadz[User::firstOrCreate<br/>username: NIP<br/>role: Ustadz<br/>password: default 'sabira123']
    CheckUstadzUser -- Sudah Ada --> SkipUstadz[Lewati / Pertahankan Akun]
    
    CreateUstadz --> Finish[Selesai & Redirect Back]
    SkipUstadz --> Finish
    Finish --> Resp([Daftar Pengguna Terupdate di Tabel Kelola User])
```

---

## 6. Alur Pelaporan & Ekspor Data (*Reporting & Export Pipeline*)

Sistem mendukung ekspor rekapitulasi baik secara massal maupun personal untuk setiap santri:

```mermaid
graph LR
    subgraph Trigger ["Pemicu Ekspor"]
        BtnCsvAll["Export CSV Semua Siswa"]
        BtnPdfAll["Export PDF Semua Siswa"]
        BtnCsvSingle["Export CSV Siswa Tertentu"]
        BtnPdfSingle["Export PDF Siswa Tertentu"]
    end

    subgraph ControllerLayer ["RekapSiswaController"]
        ProcCsv["Generate CSV Stream<br/>(fputcsv with headers)"]
        ProcPdf["Query Eager Loading<br/>(Siswa + Setorans + Ustadz)"]
        BladeView["Render Blade Template<br/>(pdf.rekap_semua)"]
        DomPdf["DomPDF Engine<br/>Page-break per Santri"]
    end

    subgraph Output ["File Hasil Unduhan"]
        FileCsv[".csv File (Excel Compatible)"]
        FilePdf[".pdf File (A4 Ready to Print)"]
    end

    BtnCsvAll --> ProcCsv --> FileCsv
    BtnCsvSingle --> ProcCsv --> FileCsv

    BtnPdfAll --> ProcPdf --> BladeView --> DomPdf --> FilePdf
    BtnPdfSingle --> ProcPdf --> BladeView --> DomPdf --> FilePdf
```

---

## 7. Status & Siklus Sesi Autentikasi (*Authentication State Machine*)

```mermaid
stateDiagram-v2
    [*] --> Guest: Pengunjung Belum Login
    Guest --> LoginAttempt: Submit Form Login (Username + Password)
    
    state LoginAttempt {
        [*] --> RateLimitCheck
        RateLimitCheck --> VerifyCredentials: Di bawah 5 percobaan
        RateLimitCheck --> LockedOut: >= 5 percobaan gagal
        VerifyCredentials --> AuthSuccess: Password Sesuai
        VerifyCredentials --> AuthFailed: Password / Username Salah
    }
    
    AuthFailed --> Guest: Tampilkan Pesan Error
    LockedOut --> Guest: Blokir Akses Sementara (Throttle 60s)
    
    AuthSuccess --> Authenticated: Regenerasi Sesi & CSRF Token
    
    state Authenticated {
        [*] --> RoleResolver
        RoleResolver --> DashboardAdmin: role == 'Admin'
        RoleResolver --> DashboardUstadz: role == 'Ustadz'
        RoleResolver --> DashboardSiswa: role == 'Siswa'
    }
    
    Authenticated --> Guest: Klik Logout / Sesi Expire (120 Menit)
```
