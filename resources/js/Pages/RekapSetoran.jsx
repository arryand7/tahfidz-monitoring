import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TablePagination from '@/Components/TablePagination';
import { exportToCsv } from '@/Utils/exportCsv';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function RekapSetoran({ auth, siswas, semuaRiwayat, isStudent, currentStudent }) {
    // State Filter & Pencarian
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSiswa, setSelectedSiswa] = useState('');
    const [filterWaktu, setFilterWaktu] = useState('Semua Waktu');
    const [filterJenis, setFilterJenis] = useState('Semua Jenis');
    const [filterNilai, setFilterNilai] = useState('Semua Nilai');

    // State Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    // Filter Logic
    const filteredRiwayat = useMemo(() => {
        return semuaRiwayat.filter((item) => {
            // 1. Text Search (Nama Siswa, NIS, Surah, Ustadz, Catatan)
            const query = searchQuery.toLowerCase().trim();
            const matchSearch =
                !query ||
                item.namaSiswa?.toLowerCase().includes(query) ||
                item.nis?.toLowerCase().includes(query) ||
                item.surah?.toLowerCase().includes(query) ||
                item.ustadz?.toLowerCase().includes(query) ||
                item.catatan?.toLowerCase().includes(query);

            // 2. Siswa Filter
            const matchSiswa = !selectedSiswa || item.siswaId === parseInt(selectedSiswa);

            // 3. Jenis Filter
            const matchJenis = filterJenis === 'Semua Jenis' || item.jenis === filterJenis;

            // 4. Nilai Filter
            const matchNilai = filterNilai === 'Semua Nilai' || item.nilai === filterNilai;

            // 5. Waktu Filter
            let matchWaktu = true;
            if (filterWaktu !== 'Semua Waktu' && item.tanggal) {
                const itemDate = new Date(item.tanggal);
                const today = new Date();
                itemDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);

                if (filterWaktu === 'Hari Ini') {
                    matchWaktu = itemDate.getTime() === today.getTime();
                } else if (filterWaktu === 'Pekan Ini') {
                    const day = today.getDay();
                    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(diffToMonday);
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    matchWaktu = itemDate >= startOfWeek && itemDate <= endOfWeek;
                } else if (filterWaktu === 'Bulan Ini') {
                    matchWaktu =
                        itemDate.getMonth() === today.getMonth() &&
                        itemDate.getFullYear() === today.getFullYear();
                }
            }

            return matchSearch && matchSiswa && matchJenis && matchNilai && matchWaktu;
        });
    }, [semuaRiwayat, searchQuery, selectedSiswa, filterWaktu, filterJenis, filterNilai]);

    // Data Terpotong Halaman
    const paginatedRiwayat = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredRiwayat.slice(start, start + pageSize);
    }, [filteredRiwayat, currentPage, pageSize]);

    // Export CSV Handlers
    const handleExportFilteredCsv = () => {
        const columns = [
            { label: 'Tanggal', key: 'tanggal' },
            { label: 'NIS', key: 'nis' },
            { label: 'Nama Santri', key: 'namaSiswa' },
            { label: 'Kelas', key: 'kelas' },
            { label: 'Pembimbing', key: 'ustadz' },
            { label: 'Jenis Setoran', key: 'jenis' },
            { label: 'Surah', key: 'surah' },
            { label: 'Ayat', key: 'ayat' },
            { label: 'Nilai', key: 'nilai' },
            { label: 'Catatan', key: 'catatan' },
        ];
        const filename = isStudent
            ? `Riwayat_Setoran_${currentStudent?.nis || 'Santri'}`
            : `Rekap_Setoran_${filterWaktu.replace(/\s+/g, '_')}`;
        exportToCsv(filename, columns, filteredRiwayat);
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedSiswa('');
        setFilterWaktu('Semua Waktu');
        setFilterJenis('Semua Jenis');
        setFilterNilai('Semua Nilai');
        setCurrentPage(1);
    };

    const hasActiveFilter =
        Boolean(searchQuery) ||
        Boolean(selectedSiswa) ||
        filterWaktu !== 'Semua Waktu' ||
        filterJenis !== 'Semua Jenis' ||
        filterNilai !== 'Semua Nilai';

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={isStudent ? 'Riwayat Setoran Saya' : 'Rekap Setoran Tahfidz'}
        >
            <Head title={isStudent ? 'Riwayat Setoran Saya' : 'Rekap Setoran'} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Banner Khusus Siswa */}
                {isStudent && (
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🕌</span>
                            <div>
                                <h3 className="font-bold text-base">
                                    Riwayat Setoran Santri: {currentStudent?.nama || auth.user.name}
                                </h3>
                                <p className="text-xs text-emerald-100">
                                    NIS: {currentStudent?.nis || '-'} • Kelas: {currentStudent?.kelas || '-'} • Total {semuaRiwayat.length} Setoran tercatat
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleExportFilteredCsv}
                            className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2"
                        >
                            <span>📥</span> Unduh Riwayat (CSV)
                        </button>
                    </div>
                )}

                {/* KOTAK FILTER & PENCARIAN MODERN */}
                <div className="p-5 bg-white border border-gray-200/80 shadow-sm rounded-2xl space-y-4">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🔍</span>
                            <h3 className="text-sm font-bold text-gray-800">Filter & Pencarian Lanjutan</h3>
                            {hasActiveFilter && (
                                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                                    Filter Aktif
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 self-end">
                            {hasActiveFilter && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition font-medium flex items-center gap-1"
                                >
                                    <span>✕</span> Reset Filter
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleExportFilteredCsv}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                            >
                                <span>📥</span> Ekspor CSV ({filteredRiwayat.length})
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Pencarian Text */}
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Pencarian Cepat
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    🔎
                                </span>
                                <input
                                    type="text"
                                    placeholder="Cari surah, siswa, ustadz, catatan..."
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
                        </div>

                        {/* Dropdown Siswa (Hanya jika bukan siswa) */}
                        {!isStudent && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Santri / Siswa
                                </label>
                                <select
                                    value={selectedSiswa}
                                    onChange={(e) => {
                                        setSelectedSiswa(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full text-xs py-2 border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">-- Semua Santri --</option>
                                    {siswas.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.nis} - {s.nama} ({s.kelas})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Filter Rentang Waktu */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Periode Waktu
                            </label>
                            <select
                                value={filterWaktu}
                                onChange={(e) => {
                                    setFilterWaktu(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full text-xs py-2 border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="Semua Waktu">Semua Waktu</option>
                                <option value="Hari Ini">Hari Ini</option>
                                <option value="Pekan Ini">Pekan Ini</option>
                                <option value="Bulan Ini">Bulan Ini</option>
                            </select>
                        </div>

                        {/* Filter Jenis */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Jenis Setoran
                            </label>
                            <select
                                value={filterJenis}
                                onChange={(e) => {
                                    setFilterJenis(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full text-xs py-2 border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="Semua Jenis">Semua Jenis</option>
                                <option value="Hafalan">Hafalan Baru</option>
                                <option value="Murojaah">Murojaah</option>
                            </select>
                        </div>

                        {/* Filter Nilai */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Predikat Nilai
                            </label>
                            <select
                                value={filterNilai}
                                onChange={(e) => {
                                    setFilterNilai(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full text-xs py-2 border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="Semua Nilai">Semua Predikat</option>
                                <option value="Baik">Baik (Mumtaz)</option>
                                <option value="Cukup">Cukup (Jayyid)</option>
                                <option value="Kurang">Kurang (Maqbul)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* TABEL DATA REKAP SETORAN */}
                <div className="overflow-hidden bg-white border border-gray-200/80 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-800">
                                {isStudent ? 'Daftar Catatan Setoran' : 'Daftar Seluruh Setoran'}
                            </h3>
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                                {filteredRiwayat.length} Data
                            </span>
                        </div>
                        <span className="text-xs text-gray-400">
                            Halaman {currentPage} dari {Math.max(1, Math.ceil(filteredRiwayat.length / pageSize))}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4">Tanggal</th>
                                    {!isStudent && <th className="py-3 px-4">Santri</th>}
                                    <th className="py-3 px-4">Pembimbing</th>
                                    <th className="py-3 px-4">Jenis</th>
                                    <th className="py-3 px-4">Surah & Ayat</th>
                                    <th className="py-3 px-4 text-center">Predikat</th>
                                    <th className="py-3 px-4">Catatan Ustadz</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedRiwayat.length > 0 ? (
                                    paginatedRiwayat.map((item) => (
                                        <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                                            <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                                                {item.tanggal}
                                            </td>
                                            {!isStudent && (
                                                <td className="py-3.5 px-4">
                                                    <div>
                                                        <span className="font-bold text-emerald-800 block">
                                                            {item.namaSiswa}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400">
                                                            NIS: {item.nis} • {item.kelas}
                                                        </span>
                                                    </div>
                                                </td>
                                            )}
                                            <td className="py-3.5 px-4 font-medium text-gray-700">
                                                {item.ustadz}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                                        item.jenis === 'Hafalan'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}
                                                >
                                                    <span>{item.jenis === 'Hafalan' ? '📗' : '🔄'}</span>
                                                    {item.jenis}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-semibold text-gray-900 block">
                                                    {item.surah}
                                                </span>
                                                <span className="text-[11px] text-gray-500 font-mono">
                                                    Ayat {item.ayat}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span
                                                    className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                                                        item.nilai === 'Baik'
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : item.nilai === 'Cukup'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}
                                                >
                                                    {item.nilai}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                                                {item.catatan || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={isStudent ? 6 : 7}
                                            className="py-12 text-center text-gray-400"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <span className="text-4xl">📂</span>
                                                <p className="text-sm font-medium text-gray-600">
                                                    Tidak ada data setoran yang cocok dengan filter.
                                                </p>
                                                {hasActiveFilter && (
                                                    <button
                                                        type="button"
                                                        onClick={resetFilters}
                                                        className="text-xs text-emerald-600 hover:underline font-semibold"
                                                    >
                                                        Reset filter untuk melihat semua data
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    <TablePagination
                        currentPage={currentPage}
                        totalItems={filteredRiwayat.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        pageSizeOptions={[10, 15, 25, 50, 100]}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
