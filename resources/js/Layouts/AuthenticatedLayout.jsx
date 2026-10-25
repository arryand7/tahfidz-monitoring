import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react'; // Pastikan baris ini ada

export default function AuthenticatedLayout({ user, header, children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem('isSidebarOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('isSidebarOpen', JSON.stringify(isSidebarOpen));
    }, [isSidebarOpen]);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar Kiri (Desktop) */}
            <aside className={`flex-shrink-0 hidden bg-white border-r shadow-sm md:flex md:flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="flex items-center justify-between p-6">
                    {isSidebarOpen && <span className="font-bold text-emerald-700">SABIRA TAHFIDZ</span>}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-emerald-600">
                        {isSidebarOpen ? '«' : '»'}
                    </button>
                </div>

                <nav className="p-4 space-y-2 text-sm font-medium overflow-y-auto custom-scrollbar h-[calc(100vh-4rem)]">

                    {/* --- MENU UNTUK SEMUA ROLE --- */}
                    <Link
                        href={route('dashboard')}
                        className={`flex items-center whitespace-nowrap px-4 py-2 rounded-lg transition-colors ${
                            route().current('dashboard')
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                    >
                        <span className="text-lg">📊</span>
                        {isSidebarOpen && <span className="ml-3">Dashboard Utama</span>}
                    </Link>

                    <Link
                        href={route('rekap.setoran')}
                        className={`flex items-center whitespace-nowrap px-4 py-2 rounded-lg transition-colors ${
                            route().current('rekap.setoran')
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                    >
                        <span className="text-lg">📁</span>
                        {isSidebarOpen && <span className="ml-3">Rekap Setoran</span>}
                    </Link>


                    {/* --- MENU KHUSUS ADMIN & USTADZ --- */}
                    {(user?.role === 'Admin' || user?.role === 'Ustadz') && (
                        <>
                            <Link
                                href={route('input.setoran')}
                                className={`flex items-center whitespace-nowrap px-4 py-2 rounded-lg transition-colors ${
                                    route().current('input.setoran')
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                            >
                                <span className="text-lg">✍️</span>
                                {isSidebarOpen && <span className="ml-3">Input Setoran</span>}
                            </Link>

                            <Link
                                href={route('rekap.siswa')}
                                className={`flex items-center whitespace-nowrap px-4 py-2 rounded-lg transition-colors ${
                                    route().current('rekap.siswa')
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                }`}
                            >
                                <span className="text-lg">🎓</span>
                                {isSidebarOpen && <span className="ml-3">Rekap Siswa</span>}
                            </Link>
                        </>
                    )}


                    {/* --- MENU KHUSUS ADMIN SAJA --- */}
                    {user?.role === 'Admin' && (
                        <>
                            <div className="pt-6 pb-2">
                                <p className="px-4 text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Data Master Admin
                                </p>
                            </div>

                            <Link href={route('master.siswa')} className={`flex items-center whitespace-nowrap px-4 py-2 rounded-lg transition-colors ${route().current('master.siswa') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                                <span className="text-lg">🗂️</span>
                                {isSidebarOpen && <span className="ml-3">Database Siswa</span>}
                            </Link>

                            <Link href={route('master.ustadz')} className={`flex items-center whitespace-nowrap px-4 py-2 rounded-lg transition-colors ${route().current('master.ustadz') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                                <span className="text-lg">👨‍🏫</span>
                                {isSidebarOpen && <span className="ml-3">Database Ustadz</span>}
                            </Link>

                            <Link href={route('master.quran')} className={`flex items-center whitespace-nowrap px-4 py-2 rounded-lg transition-colors ${route().current('master.quran') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                                <span className="text-lg">📖</span>
                                {isSidebarOpen && <span className="ml-3">Master Al-Quran</span>}
                            </Link>

                            <Link href={route('kelola.user')} className={`flex items-center whitespace-nowrap px-4 py-2 rounded-lg transition-colors ${route().current('kelola.user*') ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                                <span className="text-lg">⚙️</span>
                                {isSidebarOpen && <span className="ml-3">Kelola User</span>}
                            </Link>
                        </>
                    )}

                </nav>
            </aside>

            {/* Area Konten Kanan */}
            <div className="flex flex-col flex-1 min-w-0 bg-gray-50">
                {/* Header Atas */}
                <header className="flex items-center justify-between flex-shrink-0 h-16 px-6 bg-white border-b shadow-sm">
                    {/* Judul Halaman Aktif (Diambil dari props header) */}
                    <div className="flex-1">
                        {header && <h1 className="text-xl font-semibold text-gray-800">{header}</h1>}
                    </div>

                    {/* Profil User */}
                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">
                            Halo, {user?.name ?? 'Pengguna'}
                        </span>
                        {/* Tombol Logout Sementara */}
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-sm text-red-500 hover:text-red-700"
                        >
                            Log Out
                        </Link>
                    </div>
                </header>

                {/* Render Halaman Aktif */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        {children}
                    </div>

            </div>
        </div>
    );
}
