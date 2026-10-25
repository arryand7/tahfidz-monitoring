import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function RekapSiswa({ auth, rekapSiswaData }) {
    // State untuk fitur pencarian cepat
    const [searchQuery, setSearchQuery] = useState('');

    // HAPUS DATA DUMMY 'const rekapSiswa = [...]' DI SINI

    // Logika Pencarian menggunakan rekapSiswaData dari database
    const filteredSiswa = rekapSiswaData.filter(siswa =>
        siswa.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        siswa.nis.includes(searchQuery)
    );

    return (
        <AuthenticatedLayout user={auth.user} header="Direktori Laporan & Cetak Rekap">
            <Head title="Rekap Siswa" />

            <div className="space-y-6">

                {/* HEADER AKSI MASSAL */}
                <div className="flex flex-col items-center justify-between p-6 bg-white border border-gray-100 shadow-sm md:flex-row rounded-xl">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Cetak Laporan Keseluruhan</h3>
                        <p className="text-sm text-gray-500">Ekspor rekap setoran seluruh siswa ke dalam format dokumen.</p>
                    </div>
                    <div className="flex mt-4 space-x-3 md:mt-0">
                        <a
                            href={route('rekap.siswa.pdf')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors bg-red-500 rounded-lg shadow-sm hover:bg-red-600"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Cetak Semua (PDF)
                        </a>

                        {/* Tombol CSV */}
                        <a
                            href={route('rekap.siswa.csv')}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Export Semua (CSV)
                        </a>
                    </div>
                </div>

                {/* TABEL DIREKTORI SISWA */}
                <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
                    {/* Header Tabel & Pencarian */}
                    <div className="flex flex-col items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 md:flex-row">
                        <h3 className="mb-4 text-lg font-medium text-gray-900 md:mb-0">Daftar Rekap Individu</h3>
                        <div className="relative w-full md:w-72">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari Nama atau NIS..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 text-sm border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-white border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">NIS</th>
                                    <th className="px-6 py-3">Nama Siswa</th>
                                    <th className="px-6 py-3">Kelas</th>
                                    <th className="px-6 py-3 text-center">Total Setoran<br/><span className="text-[10px] text-gray-400 font-normal">(Hafalan / Murojaah)</span></th>
                                    <th className="px-6 py-3 text-right">Aksi Cetak</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSiswa.length > 0 ? (
                                    filteredSiswa.map((siswa) => (
                                        <tr key={siswa.id} className="transition-colors bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{siswa.nis}</td>
                                            <td className="px-6 py-4 font-semibold text-emerald-700">{siswa.nama}</td>
                                            <td className="px-6 py-4">{siswa.kelas}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <span className="px-2 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-700" title="Hafalan">H: {siswa.totalHafalan}</span>
                                                    <span className="px-2 py-1 text-xs font-medium text-blue-700 rounded bg-blue-50" title="Murojaah">M: {siswa.totalMurojaah}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end space-x-2">
                                                    {/* Tombol PDF Individual */}
                                                    <a
                                                        href={route('rekap.siswa.pdf.single', siswa.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block p-2 text-red-600 transition-colors rounded bg-red-50 hover:bg-red-100"
                                                        title="Cetak PDF Siswa"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                                    </a>

                                                    {/* Tombol CSV Individual */}
                                                    <a
                                                        href={route('rekap.siswa.csv.single', siswa.id)}
                                                        className="block p-2 transition-colors rounded text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                                                        title="Export CSV Siswa"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            Siswa tidak ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
