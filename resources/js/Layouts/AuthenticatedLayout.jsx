import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function AuthenticatedLayout({ user, header, children }) {
    const { auth } = usePage().props;
    const currentUser = user || auth?.user;
    const permissions = auth?.permissions || {};
    const linkedSiswa = auth?.linkedSiswa;
    const isStudent = currentUser?.role === 'Siswa';

    // Helper cek permission dinamis (bisa melihat menu jika level 'view' atau 'manage')
    const can = (feature) => {
        if (currentUser?.role === 'Admin' && feature === 'kelola_hak_akses') return true;
        const val = permissions[feature];
        return val === 'view' || val === 'manage' || val === true;
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('isSidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('isSidebarOpen', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    const hasMasterMenu = can('master_siswa') || can('master_ustadz') || can('master_quran');
    const hasAdminMenu = can('kelola_user') || can('sync_sso') || can('kelola_hak_akses');

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Ustadz':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Siswa':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar Kiri (Desktop) */}
            <aside
                className={`flex-shrink-0 hidden bg-white border-r shadow-sm md:flex md:flex-col transition-all duration-300 ${
                    isSidebarOpen ? 'w-64' : 'w-20'
                }`}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📖</span>
                            <div>
                                <span className="font-extrabold text-emerald-700 tracking-wide block text-sm">
                                    SABIRA TAHFIDZ
                                </span>
                                <span className="text-[10px] text-gray-400 block font-medium">
                                    Portal Quran & Tahfidz
                                </span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-2xl mx-auto">📖</span>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-gray-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
                        title={isSidebarOpen ? 'Persempit Sidebar' : 'Perluas Sidebar'}
                    >
                        {isSidebarOpen ? '«' : '»'}
                    </button>
                </div>

                <nav className="p-4 space-y-1.5 text-sm font-medium overflow-y-auto custom-scrollbar h-[calc(100vh-4rem)]">
                    {/* --- MENU UTAMA --- */}
                    {can('dashboard') && (
                        <Link
                            href={route('dashboard')}
                            className={`flex items-center whitespace-nowrap px-3.5 py-2.5 rounded-xl transition-all ${
                                route().current('dashboard')
                                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                        >
                            <span className="text-lg">📊</span>
                            {isSidebarOpen && (
                                <span className="ml-3">
                                    {isStudent ? 'Dashboard Santri' : 'Dashboard Utama'}
                                </span>
                            )}
                        </Link>
                    )}

                    {can('input_setoran') && (
                        <Link
                            href={route('input.setoran')}
                            className={`flex items-center whitespace-nowrap px-3.5 py-2.5 rounded-xl transition-all ${
                                route().current('input.setoran')
                                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                        >
                            <span className="text-lg">✍️</span>
                            {isSidebarOpen && <span className="ml-3">Input Setoran</span>}
                        </Link>
                    )}

                    {can('rekap_setoran') && (
                        <Link
                            href={route('rekap.setoran')}
                            className={`flex items-center whitespace-nowrap px-3.5 py-2.5 rounded-xl transition-all ${
                                route().current('rekap.setoran')
                                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                        >
                            <span className="text-lg">📁</span>
                            {isSidebarOpen && (
                                <span className="ml-3">
                                    {isStudent ? 'Riwayat Setoran' : 'Rekap Setoran'}
                                </span>
                            )}
                        </Link>
                    )}

                    {can('rekap_siswa') && (
                        <Link
                            href={route('rekap.siswa')}
                            className={`flex items-center whitespace-nowrap px-3.5 py-2.5 rounded-xl transition-all ${
                                route().current('rekap.siswa*')
                                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                        >
                            <span className="text-lg">🎓</span>
                            {isSidebarOpen && (
                                <span className="ml-3">
                                    {isStudent ? 'Progress Hafalan' : 'Rekap Siswa'}
                                </span>
                            )}
                        </Link>
                    )}

                    {/* --- KELOMPOK DATA MASTER --- */}
                    {hasMasterMenu && (
                        <>
                            <div className="pt-5 pb-1">
                                {isSidebarOpen ? (
                                    <p className="px-3 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                                        Data Master
                                    </p>
                                ) : (
                                    <hr className="my-2 border-gray-200" />
                                )}
                            </div>

                            {can('master_siswa') && (
                                <Link
                                    href={route('master.siswa')}
                                    className={`flex items-center whitespace-nowrap px-3.5 py-2.5 rounded-xl transition-all ${
                                        route().current('master.siswa')
                                            ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                                            : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                >
                                    <span className="text-lg">🗂️</span>
                                    {isSidebarOpen && <span className="ml-3">Database Siswa</span>}
                                </Link>
                            )}

                            {can('master_ustadz') && (
                                <Link
                                    href={route('master.ustadz')}
                                    className={`flex items-center whitespace-nowrap px-3.5 py-2.5 rounded-xl transition-all ${
                                        route().current('master.ustadz')
                                            ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                                            : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                >
                                    <span className="text-lg">👨‍🏫</span>
                                    {isSidebarOpen && <span className="ml-3">Database Ustadz</span>}
                                </Link>
                            )}

                            {can('master_quran') && (
                                <Link
                                    href={route('master.quran')}
                                    className={`flex items-center whitespace-nowrap px-3.5 py-2.5 rounded-xl transition-all ${
                                        route().current('master.quran')
                                            ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                                            : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                >
                                    <span className="text-lg">📖</span>
                                    {isSidebarOpen && <span className="ml-3">Master Al-Quran</span>}
                                </Link>
                            )}
                        </>
                    )}

                    {/* --- KELOMPOK ADMINISTRASI --- */}
                    {hasAdminMenu && (
                        <>
                            <div className="pt-5 pb-1">
                                {isSidebarOpen ? (
                                    <p className="px-3 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                                        Administrasi Sistem
                                    </p>
                                ) : (
                                    <hr className="my-2 border-gray-200" />
                                )}
                            </div>

                            {can('kelola_user') && (
                                <Link
                                    href={route('kelola.user')}
                                    className={`flex items-center whitespace-nowrap px-3.5 py-2.5 rounded-xl transition-all ${
                                        route().current('kelola.user*')
                                            ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                                            : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                >
                                    <span className="text-lg">⚙️</span>
                                    {isSidebarOpen && <span className="ml-3">Kelola User</span>}
                                </Link>
                            )}

                            {can('sync_sso') && (
                                <Link
                                    href={route('sync.sso')}
                                    className={`flex items-center whitespace-nowrap px-3.5 py-2.5 rounded-xl transition-all ${
                                        route().current('sync.sso*')
                                            ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                                            : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                >
                                    <span className="text-lg">🔄</span>
                                    {isSidebarOpen && <span className="ml-3">Sinkronisasi SSO</span>}
                                </Link>
                            )}

                            {can('kelola_hak_akses') && (
                                <Link
                                    href={route('kelola.hak-akses')}
                                    className={`flex items-center whitespace-nowrap px-3.5 py-2.5 rounded-xl transition-all ${
                                        route().current('kelola.hak-akses*')
                                            ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                                            : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                    }`}
                                >
                                    <span className="text-lg">🛡️</span>
                                    {isSidebarOpen && <span className="ml-3">Hak Akses (RBAC)</span>}
                                </Link>
                            )}
                        </>
                    )}
                </nav>
            </aside>

            {/* Area Konten Kanan */}
            <div className="flex flex-col flex-1 min-w-0 bg-gray-50 overflow-hidden">
                {/* Header Atas */}
                <header className="flex items-center justify-between flex-shrink-0 h-16 px-6 bg-white border-b shadow-sm z-10">
                    {/* Judul Halaman Aktif */}
                    <div className="flex items-center gap-3">
                        {header && <h1 className="text-lg font-bold text-gray-800">{header}</h1>}
                    </div>

                    {/* Profil User */}
                    <div className="flex items-center space-x-3">
                        <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getRoleBadge(
                                currentUser?.role
                            )}`}
                        >
                            {currentUser?.role === 'Siswa' ? 'Santri' : currentUser?.role}
                        </span>

                        {isStudent && linkedSiswa && (
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                <span>NIS: {linkedSiswa.nis}</span>
                                <span>•</span>
                                <span>{linkedSiswa.kelas}</span>
                            </span>
                        )}

                        <div className="text-right hidden sm:block">
                            <span className="text-xs font-semibold text-gray-800 block">
                                {currentUser?.name ?? 'Pengguna'}
                            </span>
                            <span className="text-[11px] text-gray-400 block">
                                {currentUser?.email ?? currentUser?.username}
                            </span>
                        </div>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        >
                            Keluar
                        </Link>
                    </div>
                </header>

                {/* Render Halaman Aktif */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
