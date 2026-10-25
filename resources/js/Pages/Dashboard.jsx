import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ auth, isStudent, studentProfile, stats, recentLogs }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={isStudent ? 'Dashboard Santri' : 'Dashboard Utama'}
        >
            <Head title={isStudent ? 'Dashboard Santri' : 'Dashboard'} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* --- WELCOME CARD (KHUSUS SANTRI) --- */}
                {isStudent && (
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">Assalamu'alaikum,</span>
                                <h2 className="text-xl font-bold">{studentProfile?.nama || auth.user.name}!</h2>
                            </div>
                            <p className="text-xs text-emerald-100 max-w-xl">
                                Selamat datang di portal tahfidz Anda. Pantau terus capaian hafalan dan murojaah Al-Qur'an Anda setiap hari dengan istiqomah.
                            </p>
                            <div className="flex items-center gap-2 pt-2 text-xs">
                                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-xs rounded-full font-semibold">
                                    NIS: {studentProfile?.nis || auth.user.username}
                                </span>
                                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-xs rounded-full font-semibold">
                                    Kelas: {studentProfile?.kelas || '-'}
                                </span>
                            </div>
                        </div>

                        <div className="self-end md:self-center">
                            <Link
                                href={route('rekap.setoran')}
                                className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                            >
                                <span>📁</span> Buka Riwayat Setoran Saya
                            </Link>
                        </div>
                    </div>
                )}

                {/* --- BAGIAN 1: KARTU STATISTIK --- */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Kartu 1: Total Setoran */}
                    <div className="p-5 bg-white border border-gray-200/80 shadow-xs rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-bold border border-emerald-100">
                            📊
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {isStudent ? 'Total Setoran Saya' : 'Siswa Setoran Hari Ini'}
                            </p>
                            <div className="flex items-baseline mt-1 gap-2">
                                <h3 className="text-2xl font-extrabold text-gray-900">
                                    {stats.totalSiswaSetoran}
                                </h3>
                                <span className="text-xs text-gray-500 font-medium">
                                    {isStudent ? 'Kali Setoran' : 'Siswa'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Kartu 2: Hafalan Baru */}
                    <div className="p-5 bg-white border border-gray-200/80 shadow-xs rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-bold border border-emerald-100">
                            📗
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {isStudent ? 'Hafalan Baru Tercatat' : 'Hafalan Baru Hari Ini'}
                            </p>
                            <div className="flex items-baseline mt-1 gap-2">
                                <h3 className="text-2xl font-extrabold text-emerald-600">
                                    {stats.hafalanBaru}
                                </h3>
                                <span className="text-xs text-gray-500 font-medium">
                                    {isStudent ? 'Setoran' : 'Siswa'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Kartu 3: Murojaah */}
                    <div className="p-5 bg-white border border-gray-200/80 shadow-xs rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-2xl font-bold border border-blue-100">
                            🔄
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {isStudent ? 'Murojaah Diulang' : 'Murojaah Hari Ini'}
                            </p>
                            <div className="flex items-baseline mt-1 gap-2">
                                <h3 className="text-2xl font-extrabold text-blue-600">
                                    {stats.murojaah}
                                </h3>
                                <span className="text-xs text-gray-500 font-medium">
                                    {isStudent ? 'Setoran' : 'Siswa'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BAGIAN 2: TABEL LOG SETORAN TERKINI --- */}
                <div className="overflow-hidden bg-white border border-gray-200/80 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                        <div className="flex items-center gap-2">
                            <span className="text-base">🕒</span>
                            <h3 className="text-sm font-bold text-gray-800">
                                {isStudent ? '10 Riwayat Setoran Terakhir Saya' : '10 Log Setoran Terkini (Hari Ini)'}
                            </h3>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                            {recentLogs.length} Data Terbaru
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-6">Waktu / Tanggal</th>
                                    {!isStudent && <th className="py-3 px-6">Nama Siswa</th>}
                                    <th className="py-3 px-6">Pembimbing</th>
                                    <th className="py-3 px-6">Jenis</th>
                                    <th className="py-3 px-6">Surah & Ayat</th>
                                    <th className="py-3 px-6 text-center">Penilaian</th>
                                    <th className="py-3 px-6">Catatan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentLogs.length > 0 ? (
                                    recentLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-emerald-50/40 transition-colors">
                                            <td className="py-3.5 px-6 font-medium text-gray-900 whitespace-nowrap">
                                                <div>
                                                    <span className="font-semibold block">{log.waktu}</span>
                                                    <span className="text-[11px] text-gray-400">{log.tanggal}</span>
                                                </div>
                                            </td>
                                            {!isStudent && (
                                                <td className="py-3.5 px-6 font-bold text-emerald-800 text-sm">
                                                    {log.siswa}
                                                </td>
                                            )}
                                            <td className="py-3.5 px-6 font-medium text-gray-700">
                                                {log.ustadz}
                                            </td>
                                            <td className="py-3.5 px-6">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                                        log.jenis === 'Hafalan'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}
                                                >
                                                    <span>{log.jenis === 'Hafalan' ? '📗' : '🔄'}</span>
                                                    {log.jenis}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-6 font-semibold text-gray-900">
                                                {log.detail}
                                            </td>
                                            <td className="py-3.5 px-6 text-center">
                                                <span
                                                    className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                                                        log.nilai === 'Baik'
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : log.nilai === 'Cukup'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}
                                                >
                                                    {log.nilai}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-6 text-gray-500 max-w-xs truncate">
                                                {log.catatan || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={isStudent ? 6 : 7}
                                            className="py-10 text-center text-gray-400"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-1">
                                                <span className="text-3xl">📖</span>
                                                <p className="text-xs font-medium text-gray-600">
                                                    Belum ada catatan setoran terbaru.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-3.5 text-center border-t border-gray-100 bg-gray-50/50">
                        <Link
                            href={route('rekap.setoran')}
                            className="inline-flex items-center text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
                        >
                            {isStudent ? 'Lihat Seluruh Riwayat Setoran Saya' : 'Buka Halaman Rekap Lengkap'}{' '}
                            <span className="ml-1.5">&rarr;</span>
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
