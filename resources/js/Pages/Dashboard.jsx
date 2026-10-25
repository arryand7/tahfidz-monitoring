import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ auth, stats, recentLogs }) {

    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Dashboard Utama"
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* --- BAGIAN 1: KARTU STATISTIK --- */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Kartu 1: Total Setoran Hari Ini */}
                    <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                        <p className="text-sm font-medium text-gray-500 uppercase">Total Siswa Setoran Hari Ini</p>
                        <div className="flex items-baseline mt-2">
                            <h3 className="text-3xl font-bold text-gray-900">{stats.totalSiswaSetoran}</h3>
                            <span className="ml-2 text-sm text-gray-500">Siswa</span>
                        </div>
                    </div>

                    {/* Kartu 2: Hafalan */}
                    <div className="p-6 bg-white border border-l-4 border-gray-100 shadow-sm rounded-xl border-l-emerald-500">
                        <p className="text-sm font-medium text-gray-500 uppercase">Hafalan Baru</p>
                        <div className="flex items-baseline mt-2">
                            <h3 className="text-3xl font-bold text-emerald-600">{stats.hafalanBaru}</h3>
                            <span className="ml-2 text-sm text-gray-500">Siswa</span>
                        </div>
                    </div>

                    {/* Kartu 3: Murojaah */}
                    <div className="p-6 bg-white border border-l-4 border-gray-100 shadow-sm rounded-xl border-l-blue-500">
                        <p className="text-sm font-medium text-gray-500 uppercase">Murojaah</p>
                        <div className="flex items-baseline mt-2">
                            <h3 className="text-3xl font-bold text-blue-600">{stats.murojaah}</h3>
                            <span className="ml-2 text-sm text-gray-500">Siswa</span>
                        </div>
                    </div>
                </div>

                {/* --- BAGIAN 2: TABEL LOG USTADZ --- */}
                <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-medium text-gray-900">Log Setoran & Murojaah Terkini</h3>
                        <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                            Hari Ini
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Waktu</th>
                                    <th scope="col" className="px-6 py-3">Nama Ustadz</th>
                                    <th scope="col" className="px-6 py-3">Nama Siswa</th>
                                    <th scope="col" className="px-6 py-3">Jenis</th>
                                    <th scope="col" className="px-6 py-3">Surat & Ayat</th>
                                    <th scope="col" className="px-6 py-3">Penilaian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLogs.map((log) => (
                                    <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{log.waktu}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            {log.ustadz}
                                        </td>
                                        <td className="px-6 py-4">{log.siswa}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                log.jenis === 'Hafalan' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {log.jenis}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{log.detail}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                log.nilai === 'Baik' ? 'bg-green-100 text-green-800' :
                                                log.nilai === 'Cukup' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {log.nilai}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer Tabel untuk navigasi tambahan jika lebih dari 10 */}
                    <div className="px-6 py-4 text-center border-t border-gray-100">
                        <Link
                            href={route('rekap.setoran')}
                            className="inline-flex items-center text-sm font-medium transition-colors text-emerald-600 hover:text-emerald-800"
                        >
                            Lihat Semua Log <span className="ml-1">&rarr;</span>
                        </Link>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
