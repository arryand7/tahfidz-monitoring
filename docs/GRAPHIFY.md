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
        string gate_user_uuid UK "UUID pengguna terpusat dari Gate SSO"
        string sso_sub UK "Subject ID dari OIDC UserInfo"
        timestamp sso_synced_at "Waktu sinkronisasi terakhir"
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

    SSO_SETTINGS {
        bigint id PK
        string base_url "URL Gate SSO (misal: https://gate.sabira-iibs.id)"
        string client_id "OAuth Client ID"
        text client_secret "OAuth Client Secret"
        string redirect_uri "OAuth Redirect Callback URI"
        string scopes "Scopes OIDC (openid profile email roles)"
        string local_path "Direktori lokal untuk dev fallback"
        string driver_mode "auto | remote_only | local_only"
        boolean is_enabled "Status aktif tombol SSO di Login"
        timestamp last_tested_at
        string last_test_status
        text last_test_message
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

## 6. Alur Mekanisme Sinkronisasi Gate SSO & Dry-Run (*Selective Provisioning*)

Mekanisme sinkronisasi dua tahap (*two-stage provisioning*) yang aman dengan pratinjau (*dry-run*) dan pemilihan manual (*checkbox selection*):

```mermaid
flowchart TD
    subgraph GateSource ["Gate SSO Source (Remote API / Local Fallback)"]
        RemoteGate["Remote API: https://gate.sabira-iibs.id/api/provisioning/users"]
        LocalGate["Local SQLite: /Users/ryand/Documents/LARAVEL/sabira/gate-sso"]
    end

    subgraph Phase1 ["Tahap 1: Dry-Run & Rekonsiliasi (Tanpa Mengubah Data)"]
        Fetch[GateProvisioningClient::fetchCanonicalUsers]
        Reconcile[GateUserSyncService::reconcileUsers]
        Classify{Perbandingan Data Lokal vs Gate SSO}
        
        NewUser[Kategori: Pengguna Baru]
        UpdateUser[Kategori: Perlu Update Profil]
        MatchedUser[Kategori: Sudah Sinkron / Identik]
        
        UIPreview[Render Pratinjau di SyncSso.jsx:<br/>- KPI Summary Cards<br/>- Filter Role & Status<br/>- Checkbox Select All / Parsial]
    end

    subgraph Phase2 ["Tahap 2: Eksekusi Selektif (Apply Sync)"]
        SubmitCheck[Admin Submit: Array of Selected UUIDs]
        DBTrans[Database Transaction]
        
        MapRule{Aturan Pemetaan Role}
        MapSiswa[student / siswa / santri ➔ Role: Siswa<br/>Sync ke tabel users & siswas]
        MapAdmin[admin / superadmin ➔ Role: Admin<br/>Sync ke tabel users]
        MapUstadz[teacher / staff / wali / dll. ➔ Role: Ustadz<br/>Sync ke tabel users & ustadzs]
        
        ReportBack[Lapor Hasil ke Gate SSO: /api/provisioning/sync-results]
    end

    RemoteGate -.->|Prioritas 1: HTTP Call| Fetch
    LocalGate -.->|Prioritas 2: Fallback / Offline| Fetch
    Fetch --> Reconcile
    Reconcile --> Classify
    Classify -->|Belum Ada di DB| NewUser
    Classify -->|Ada Perubahan Profil| UpdateUser
    Classify -->|Data Sama Persis| MatchedUser
    
    NewUser --> UIPreview
    UpdateUser --> UIPreview
    MatchedUser --> UIPreview
    
    UIPreview --> SubmitCheck
    SubmitCheck --> DBTrans
    DBTrans --> MapRule
    MapRule --> MapSiswa
    MapRule --> MapAdmin
    MapRule --> MapUstadz
    MapSiswa --> ReportBack
    MapAdmin --> ReportBack
    MapUstadz --> ReportBack
```

---

## 7. Alur Pelaporan & Ekspor Data (*Reporting & Export Pipeline*)

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

## 8. Status & Siklus Sesi Autentikasi (*Authentication State Machine*)

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

---

## 9. Alur Autentikasi OAuth2 / OIDC Gate SSO (*Single Sign-On Flow*)

Pengguna dapat masuk ke Sabira Tahfidz langsung menggunakan akun Gate SSO terpusat (`gate.sabira-iibs.id`) tanpa mengetikkan username & password lokal:

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna / Santri
    participant Browser as Browser Client
    participant App as Sabira Tahfidz (/sso)
    participant Gate as Gate SSO (gate.sabira-iibs.id)
    participant DB as Basis Data Lokal

    User->>Browser: Klik tombol "Masuk dengan Gate SSO"
    Browser->>App: GET /sso/login
    App->>App: Generate random state & simpan di session
    App-->>Browser: Redirect 302 ke Gate SSO /oauth/authorize
    Browser->>Gate: GET /oauth/authorize?client_id=...&redirect_uri=...&scope=openid profile email roles&state=...
    Gate->>User: Tampilkan formulir otentikasi Gate SSO
    User->>Gate: Masukkan kredensial & konfirmasi izin
    Gate-->>Browser: Redirect 302 ke /sso/callback?code=AUTH_CODE&state=...
    Browser->>App: GET /sso/callback?code=AUTH_CODE&state=...
    App->>App: Validasi kecocokan state (Anti-CSRF)
    App->>Gate: POST /oauth/token (grant_type=authorization_code)
    Gate-->>App: Return JSON { access_token, expires_in, token_type }
    App->>Gate: GET /oauth/userinfo (Bearer access_token)
    Gate-->>App: Return JSON { sub, name, email, type, nis, nip, roles }
    App->>DB: Query User berdasarkan sso_sub / gate_user_uuid / username / email
    alt User belum terdaftar
        App->>DB: Auto-provision User baru (Role sesuai type Gate)
        alt type == student/siswa
            App->>DB: Auto-create data Siswa (NIS)
        else type == teacher/staff/lainnya
            App->>DB: Auto-create data Ustadz (NIP)
        end
    else User sudah ada
        App->>DB: Update sso_sub, sso_synced_at, & nama
    end
    App->>App: Auth::login($user, remember=true)
    App-->>Browser: Redirect 302 ke /dashboard
    Browser->>User: Masuk ke halaman Dashboard sesuai Role
```

---

## 10. Arsitektur Sinkronisasi Gate SSO Dinamis (*Dynamic Configuration Architecture*)

Sistem dirancang agar dapat di-deploy ke server mana pun dan mendukung perubahan URL Gate SSO tanpa perlu redeploy kode maupun manipulasi berkas `.env` server secara manual:

```mermaid
graph TD
    subgraph AdminUI ["Antarmuka Administrator (/sync-sso)"]
        FormConfig["Form Pengaturan Dinamis:<br/>- Base URL (https://gate...)<br/>- Client ID & Secret<br/>- Redirect URI<br/>- Driver Mode (auto / remote_only / local_only)<br/>- Toggle SSO Login Button"]
        BtnTest["Tombol 'Test Koneksi' (Live Latency & Health Check)"]
        BtnSync["Tombol 'Terapkan Sinkronisasi' (Pilih Semua / Parsial)"]
    end

    subgraph ConfigManager ["SsoSetting Model & GateProvisioningClient"]
        DBConfig[("Tabel: sso_settings")]
        EnvFallback[".env / config('services.gate') (Fallback)"]
        Resolver{"Pengaturan di Database?"}
        DBConfig -->|Ada| Resolver
        EnvFallback -->|Default| Resolver
    end

    subgraph GateNetwork ["Jaringan Gate SSO (Cloud / On-Premise)"]
        RemoteOAuth["Gate SSO OAuth2: /oauth/authorize & /oauth/token"]
        RemoteProv["Gate SSO Provisioning API: /api/provisioning/users"]
        LocalSQLite["(Dev Only) Local SQLite Fallback"]
    end

    FormConfig -->|POST /sync-sso/settings| DBConfig
    BtnTest -->|POST /sync-sso/test-connection| Resolver
    Resolver -->|Mode: remote_only / auto| RemoteProv
    Resolver -.->|Mode: local_only / auto fallback| LocalSQLite
    BtnSync -->|POST /sync-sso/apply| DBConfig
```

