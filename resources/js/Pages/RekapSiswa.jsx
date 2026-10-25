import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TablePagination from '@/Components/TablePagination';
import { exportToCsv } from '@/Utils/exportCsv';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function RekapSiswa({ auth, rekapSiswaData, isStudent, currentStudent }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterKelas, setFilterKelas] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    // Ambil daftar kelas unik
    const kelasList = useMemo(() => {
        const set = new Set();
        rekapSiswaData.forEach((s) => {
            if (s.kelas) set.add(s.kelas);
        });
        return Array.from(set).sort();
    }, [rekapSiswaData]);

    // Filter Logic
    const filteredSiswa = useMemo(() => {
        return rekapSiswaData.filter((siswa) => {
            const query = searchQuery.toLowerCase().trim();
            const matchSearch =
                !query ||
                siswa.nama?.toLowerCase().includes(query) ||
                siswa.nis?.toLowerCase().includes(query);

            const matchKelas = !filterKelas || siswa.kelas === filterKelas;

            return matchSearch && matchKelas;
        });
    }, [rekapSiswaData, searchQuery, filterKelas]);

    // Pagination
    const paginatedSiswa = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredSiswa.slice(start, start + pageSize);
    }, [filteredSiswa, currentPage, pageSize]);

    // Ekspor CSV dari tampilan aktif
    const handleExportActiveCsv = () => {
        const columns = [
            { label: 'NIS', key: 'nis' },
            { label: 'Nama Santri', key: 'nama' },
            { label: 'Kelas', key: 'kelas' },
            { label: 'Total Hafalan Baru', key: 'totalHafalan' },
            { label: 'Total Murojaah', key: 'totalMurojaah' },
        ];
        exportToCsv(`Rekap_Akumulasi_Santri_${filterKelas || 'Semua'}`, columns, filteredSiswa);
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={isStudent ? 'Rekap & Progress Hafalan Saya' : 'Rekap Akumulasi Santri'}
        >
            <Head title={isStudent ? 'Progress Hafalan' : 'Rekap Siswa'} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Banner & Aksi Massal */}
                {isStudent ? (
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">🎓</span>
                                <h3 className="text-lg font-bold">
                                    Laporan Hafalan: {currentStudent?.nama || auth.user.name}
                                </h3>
                            </div>
                            <p className="text-xs text-emerald-100">
                                NIS: {currentStudent?.nis || '-'} • Kelas: {currentStudent?.kelas || '-'}
                            </p>
                        </div>
                        {currentStudent && (
                            <div className="flex items-center gap-2.5">
                                <a
                                    href={route('rekap.siswa.pdf.single', currentStudent.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                                >
                                    <span>📄</span> Unduh PDF Raport
                                </a>
                                <a
                                    href={route('rekap.siswa.csv.single', currentStudent.id)}
                                    className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                                >
                                    <span>📊</span> Unduh CSV
                                </a>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-white border border-gray-200/80 shadow-sm rounded-2xl gap-4">
                        <div>
                            <h3 className="text-base font-bold text-gray-900">
                                Ekspor & Cetak Rekap Lengkap Seluruh Santri
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Unduh rekapitulasi data setoran seluruh santri dalam format dokumen cetak resmi PDF atau spreadsheet CSV.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2.5 self-end md:self-center">
                            <a
                                href={route('rekap.siswa.pdf')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center px-4 py-2 text-xs font-semibold text-white transition-all bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
                            >
                                <span className="mr-1.5">📄</span> Cetak Semua (PDF)
                            </a>
                            <a
                                href={route('rekap.siswa.csv')}
                                className="flex items-center px-4 py-2 text-xs font-semibold text-white transition-all bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                            >
                                <span className="mr-1.5">📊</span> Ekspor Semua (CSV)
                            </a>
                        </div>
                    </div>
                )}

                {/* Filter & Toolbar */}
                <div className="p-5 bg-white border border-gray-200/80 shadow-sm rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                            {/* Search */}
                            <div className="relative w-full sm:w-80">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    🔎
                                </span>
                                <input
                                    type="text"
                                    placeholder="Cari nama santri atau NIS..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-9 pr-8 text-xs py-2 border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Filter Kelas (jika bukan siswa) */}
                            {!isStudent && (
                                <div className="w-full sm:w-56">
                                    <select
                                        value={filterKelas}
                                        onChange={(e) => {
                                            setFilterKelas(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full text-xs py-2 border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">-- Semua Kelas --</option>
                                        {kelasList.map((k) => (
                                            <option key={k} value={k}>
                                                Kelas: {k}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {(searchQuery || filterKelas) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setFilterKelas('');
                                        setCurrentPage(1);
                                    }}
                                    className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition font-medium"
                                >
                                    ✕ Reset
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleExportActiveCsv}
                                className="px-3.5 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1.5"
                            >
                                <span>📥</span> Unduh Ringkasan
                            </button>
                        </div>
                    </div>
                </div>

                {/* TABEL DATA REKAP SISWA */}
                <div className="overflow-hidden bg-white border border-gray-200/80 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-800">
                                {isStudent ? 'Data Diri & Akumulasi Santri' : 'Daftar Santri & Total Setoran'}
                            </h3>
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                                {filteredSiswa.length} Santri
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-6">NIS</th>
                                    <th className="py-3 px-6">Nama Lengkap</th>
                                    <th className="py-3 px-6">Kelas</th>
                                    <th className="py-3 px-6 text-center">Akumulasi Setoran</th>
                                    <th className="py-3 px-6 text-right">Aksi Dokumen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedSiswa.length > 0 ? (
                                    paginatedSiswa.map((siswa) => (
                                        <tr key={siswa.id} className="hover:bg-emerald-50/40 transition-colors">
                                            <td className="py-4 px-6 font-mono font-medium text-gray-900">
                                                {siswa.nis}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-emerald-800 text-sm">
                                                {siswa.nama}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-semibold text-[11px]">
                                                    {siswa.kelas || '-'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="inline-flex items-center gap-2">
                                                    <span
                                                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        title="Total Hafalan Baru"
                                                    >
                                                        📗 Hafalan: {siswa.totalHafalan}
                                                    </span>
                                                    <span
                                                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200"
                                                        title="Total Murojaah"
                                                    >
                                                        🔄 Murojaah: {siswa.totalMurojaah}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <a
                                                        href={route('rekap.siswa.pdf.single', siswa.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                                                        title="Cetak PDF Individu"
                                                    >
                                                        <span>📄</span> PDF
                                                    </a>
                                                    <a
                                                        href={route('rekap.siswa.csv.single', siswa.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                                                        title="Unduh CSV Individu"
                                                    >
                                                        <span>📊</span> CSV
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <span className="text-4xl">🎓</span>
                                                <p className="text-sm font-medium text-gray-600">
                                                    Tidak ada data santri yang cocok.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <TablePagination
                        currentPage={currentPage}
                        totalItems={filteredSiswa.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        pageSizeOptions={[10, 15, 25, 50]}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
