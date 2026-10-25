import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    return (
        <>
            <Head title="Sabira Tahfidz — Sistem Monitoring & Evaluasi Tahfidzul Qur'an" />

            <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-emerald-50/30 to-teal-50/50 text-slate-800 antialiased selection:bg-emerald-600 selection:text-white">
                {/* Decorative Islamic Geometric Header Glow */}
                <div className="absolute inset-x-0 top-0 h-96 overflow-hidden pointer-events-none opacity-40">
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-emerald-200 via-teal-100 to-green-100 rounded-full blur-3xl" />
                </div>

                {/* Navbar */}
                <header className="relative z-20 border-b border-emerald-100/80 bg-white/80 backdrop-blur-md sticky top-0 transition-all">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                        {/* Logo & Brand */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 ring-4 ring-emerald-50">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-xl tracking-tight text-emerald-950 font-serif">SABIRA TAHFIDZ</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                                        v1.0
                                    </span>
                                </div>
                                <p className="text-xs text-emerald-700/80 font-medium">Sistem Monitoring & Evaluasi Tahfidzul Qur'an</p>
                            </div>
                        </div>

                        {/* Navigation Actions */}
                        <div className="flex items-center gap-3 sm:gap-4">
                            <a
                                href="#fitur"
                                className="hidden sm:inline-flex text-sm font-medium text-emerald-800 hover:text-emerald-950 px-3 py-2 transition"
                            >
                                Fitur Unggulan
                            </a>
                            <a
                                href="#tentang"
                                className="hidden md:inline-flex text-sm font-medium text-emerald-800 hover:text-emerald-950 px-3 py-2 transition"
                            >
                                Keunggulan
                            </a>

                            {auth?.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
                                >
                                    <span>Buka Dashboard</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-md shadow-emerald-600/25 transition-all hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Masuk Sistem</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="relative z-10">
                    <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center max-w-3xl mx-auto">
                                {/* Basmalah & Ayat Pilihan */}
                                <div className="inline-flex flex-col items-center justify-center p-3 sm:p-4 mb-6 rounded-2xl bg-white/90 border border-emerald-200/70 shadow-sm backdrop-blur">
                                    <span className="text-lg sm:text-2xl font-serif text-emerald-800 font-bold mb-1 tracking-wider" dir="rtl">
                                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                    </span>
                                    <p className="text-xs sm:text-sm text-emerald-700/90 italic font-serif">
                                        "Dan sesungguhnya telah Kami mudahkan Al-Qur'an untuk peringatan, maka adakah orang yang mau mengambil pelajaran?"
                                    </p>
                                    <span className="text-[11px] font-semibold text-emerald-600 mt-1 uppercase tracking-wider">
                                        (QS. Al-Qamar: 17)
                                    </span>
                                </div>

                                {/* Main Headline */}
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-emerald-950 tracking-tight leading-[1.15] mb-6 font-serif">
                                    Membina Generasi Qur'ani yang{' '}
                                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 bg-clip-text text-transparent">
                                        Mutqin, Disiplin & Terukur
                                    </span>
                                </h1>

                                <p className="text-base sm:text-lg text-slate-600 mb-8 sm:mb-10 leading-relaxed font-normal">
                                    Platform digital terintegrasi untuk pencatatan setoran hafalan harian, evaluasi murojaah, pemantauan halaqah musyrif, serta terhubung langsung ke <strong className="text-emerald-800 font-semibold">Central WhatsApp Bot Hub</strong>.
                                </p>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <Link
                                        href={auth?.user ? route('dashboard') : route('login')}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-xl shadow-emerald-700/20 hover:shadow-emerald-700/30 transition-all hover:-translate-y-0.5"
                                    >
                                        <span>{auth?.user ? 'Menuju Dashboard' : 'Masuk Portal Tahfidz'}</span>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </Link>

                                    <a
                                        href="#fitur"
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-base text-emerald-900 bg-white hover:bg-emerald-50/80 border border-emerald-200/90 shadow-sm hover:shadow transition"
                                    >
                                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                        <span>Jelajahi Fitur</span>
                                    </a>
                                </div>

                                {/* Security & Integration Badges */}
                                <div className="mt-8 pt-6 border-t border-emerald-200/50 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-medium text-emerald-800/80">
                                    <span className="inline-flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        WhatsApp Bot Hub Ready
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Gate SSO Authentication
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Export Raport PDF & CSV
                                    </span>
                                </div>
                            </div>

                            {/* Preview Mockup Card */}
                            <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
                                <div className="rounded-3xl bg-white p-3 sm:p-5 shadow-2xl shadow-emerald-900/10 border border-emerald-100 ring-8 ring-emerald-500/5">
                                    <div className="rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden">
                                        {/* Islamic Geometric Ambient Background */}
                                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

                                        {/* Mockup Header */}
                                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-800/60 pb-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-rose-500" />
                                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                                <span className="text-xs text-emerald-200/70 font-mono ml-2">sabira-tahfidz://monitoring/live</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                                    WhatsApp Bot API Active
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mockup Content Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                            {/* Stat Card 1 */}
                                            <div className="rounded-2xl bg-emerald-800/40 border border-emerald-700/50 p-4">
                                                <p className="text-xs text-emerald-300 font-medium">Rekap Harian Halaqah</p>
                                                <div className="flex items-baseline gap-2 mt-2">
                                                    <span className="text-3xl font-extrabold text-white">92%</span>
                                                    <span className="text-xs text-emerald-400 font-medium">Santri Setor</span>
                                                </div>
                                                <p className="text-[11px] text-emerald-200/70 mt-1">46 dari 50 santri aktif hadir</p>
                                            </div>

                                            {/* Stat Card 2 */}
                                            <div className="rounded-2xl bg-emerald-800/40 border border-emerald-700/50 p-4">
                                                <p className="text-xs text-teal-300 font-medium">Klasifikasi Setoran</p>
                                                <div className="flex items-baseline gap-2 mt-2">
                                                    <span className="text-3xl font-extrabold text-white">28</span>
                                                    <span className="text-xs text-teal-400 font-medium">Ziyadah Baru</span>
                                                </div>
                                                <p className="text-[11px] text-emerald-200/70 mt-1">18 Murojaah Penguatan Juz</p>
                                            </div>

                                            {/* Stat Card 3 */}
                                            <div className="rounded-2xl bg-emerald-800/40 border border-emerald-700/50 p-4">
                                                <p className="text-xs text-amber-300 font-medium">Kualitas Hafalan</p>
                                                <div className="flex items-baseline gap-2 mt-2">
                                                    <span className="text-3xl font-extrabold text-white">Mumtaz</span>
                                                    <span className="text-xs text-amber-400 font-medium">85% Nilai Baik</span>
                                                </div>
                                                <p className="text-[11px] text-emerald-200/70 mt-1">Tajwid & kelancaran terjaga</p>
                                            </div>
                                        </div>

                                        {/* Mockup Log Preview */}
                                        <div className="mt-5 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 p-4">
                                            <div className="flex items-center justify-between text-xs text-emerald-300 mb-3 font-semibold">
                                                <span>Log Terkini Setoran Hafalan Santri</span>
                                                <span className="text-emerald-400 font-mono text-[11px]">Auto-Sync Realtime</span>
                                            </div>
                                            <div className="space-y-2.5 text-xs">
                                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">1</span>
                                                        <div>
                                                            <p className="font-semibold text-white">Muhammad Fatih (Kelas 8A)</p>
                                                            <p className="text-[11px] text-emerald-300/80">Surah An-Naba' : 1 - 25 • Ustadz Abdullah</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                        Baik (Mumtaz)
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">2</span>
                                                        <div>
                                                            <p className="font-semibold text-white">Ahmad Ziyad (Kelas 7B)</p>
                                                            <p className="text-[11px] text-teal-300/80">Surah Al-Mulk : 1 - 30 (Murojaah) • Ustadz Umar</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                                        Baik (Lancar)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Grid Section */}
                    <section id="fitur" className="py-20 sm:py-28 bg-white border-y border-emerald-100">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center max-w-2xl mx-auto mb-16">
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                                    Solusi Digital Pesantren
                                </span>
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 mt-4 tracking-tight font-serif">
                                    Fitur Unggulan Pemantauan Hafalan
                                </h2>
                                <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
                                    Didesain khusus untuk efisiensi musyrif halaqah dan transparansi capaian hafalan santri di era modern.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* Feature 1 */}
                                <div className="group rounded-3xl bg-gradient-to-b from-emerald-50/50 to-white p-8 border border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-950 font-serif mb-2">Pencatatan Setoran Real-time</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Musyrif dapat mencatat setoran Ziyadah (hafalan baru) maupun Murojaah dengan cepat, lengkap dengan surah, rentang ayat, dan penilaian tajwid.
                                    </p>
                                </div>

                                {/* Feature 2 */}
                                <div className="group rounded-3xl bg-gradient-to-b from-emerald-50/50 to-white p-8 border border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-teal-600/20 group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-950 font-serif mb-2">WhatsApp Bot Hub Provider</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Tersedia API Manifest dan Query aman untuk bot WhatsApp: laporan harian otomatis, daftar santri belum setor, dan cek hafalan santri via chat WA.
                                    </p>
                                </div>

                                {/* Feature 3 */}
                                <div className="group rounded-3xl bg-gradient-to-b from-emerald-50/50 to-white p-8 border border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-700/20 group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-950 font-serif mb-2">Export Raport PDF & CSV</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Cetak lembar rekapitulasi setoran hafalan santri berformat PDF elegan siap cetak atau unduh berkas CSV untuk arsip akademik pesantren.
                                    </p>
                                </div>

                                {/* Feature 4 */}
                                <div className="group rounded-3xl bg-gradient-to-b from-emerald-50/50 to-white p-8 border border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white flex items-center justify-center mb-6 shadow-lg shadow-teal-700/20 group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-950 font-serif mb-2">Gate SSO & Sinkronisasi</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Masuk praktis dengan akun Gate SSO Sabira terpusat, dilengkapi fitur Dry-Run Sync dan auto-mapping santri serta ustadz secara dinamis.
                                    </p>
                                </div>

                                {/* Feature 5 */}
                                <div className="group rounded-3xl bg-gradient-to-b from-emerald-50/50 to-white p-8 border border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-950 font-serif mb-2">Hak Akses Fleksibel (RBAC)</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Matriks izin granular (Lihat Saja / Kelola Penuh) untuk tiap peran (Admin, Ustadz, Siswa), dengan isolasi data mandiri bagi santri.
                                    </p>
                                </div>

                                {/* Feature 6 */}
                                <div className="group rounded-3xl bg-gradient-to-b from-emerald-50/50 to-white p-8 border border-emerald-100 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-teal-600/20 group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm0 4h16M9 4v16" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-950 font-serif mb-2">Import & Bulk Action Cerdas</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">
                                        Import santri baru via CSV dengan preview perbandingan cerdas, serta bulk actions untuk kenaikan kelas dan kelola status massal.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Quranic Wisdom Section */}
                    <section id="tentang" className="py-20 sm:py-24 bg-gradient-to-b from-emerald-900 to-teal-950 text-white relative overflow-hidden">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-500/10">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>

                            <p className="text-2xl sm:text-3xl font-serif font-bold text-emerald-100 mb-4 tracking-wide" dir="rtl">
                                خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
                            </p>
                            <p className="text-base sm:text-lg text-emerald-200/90 italic font-serif max-w-2xl mx-auto">
                                "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya."
                            </p>
                            <span className="inline-block mt-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                                — Hadits Riwayat Al-Bukhari
                            </span>

                            <div className="mt-10 pt-10 border-t border-emerald-800/60 grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-3xl sm:text-4xl font-extrabold text-white">114</p>
                                    <p className="text-xs text-emerald-300 mt-1 font-medium">Surah Al-Qur'an</p>
                                </div>
                                <div>
                                    <p className="text-3xl sm:text-4xl font-extrabold text-white">30</p>
                                    <p className="text-xs text-emerald-300 mt-1 font-medium">Juz Terpantau</p>
                                </div>
                                <div>
                                    <p className="text-3xl sm:text-4xl font-extrabold text-white">100%</p>
                                    <p className="text-xs text-emerald-300 mt-1 font-medium">Akses Terenkripsi</p>
                                </div>
                                <div>
                                    <p className="text-3xl sm:text-4xl font-extrabold text-white">24/7</p>
                                    <p className="text-xs text-emerald-300 mt-1 font-medium">WhatsApp Bot Hub</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t border-emerald-200/60 bg-emerald-50/50 py-12 text-center text-sm text-slate-600">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📖</span>
                                <span className="font-extrabold text-emerald-950 font-serif tracking-tight">SABIRA TAHFIDZ</span>
                                <span className="text-xs text-emerald-700/70 ml-2">Islamic Boarding School Monitoring</span>
                            </div>
                            <p className="text-xs text-slate-500">
                                © {new Date().getFullYear()} Sabira Tahfidz Monitoring System. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
