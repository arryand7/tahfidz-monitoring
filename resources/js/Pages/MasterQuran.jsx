import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TablePagination from '@/Components/TablePagination';
import { exportToCsv } from '@/Utils/exportCsv';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function MasterQuran({ auth, quranList }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterJuz, setFilterJuz] = useState('Semua');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Ambil daftar nomor Juz 1-30
    const juzOptions = useMemo(() => {
        const arr = [];
        for (let i = 1; i <= 30; i++) arr.push(i);
        return arr;
    }, []);

    // Filter Logic
    const filteredQuran = useMemo(() => {
        return quranList.filter((quran) => {
            const query = searchQuery.toLowerCase().trim();
            const matchSearch =
                !query ||
                quran.nama_surah.toLowerCase().includes(query) ||
                quran.arti.toLowerCase().includes(query) ||
                quran.posisi_juz.toLowerCase().includes(query) ||
                String(quran.id) === query;

            const matchJuz =
                filterJuz === 'Semua' ||
                quran.posisi_juz.toLowerCase().includes(`juz ${filterJuz}`) ||
                quran.posisi_juz === String(filterJuz);

            return matchSearch && matchJuz;
        });
    }, [quranList, searchQuery, filterJuz]);

    // Pagination
    const paginatedQuran = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredQuran.slice(start, start + pageSize);
    }, [filteredQuran, currentPage, pageSize]);

    // Ekspor CSV
    const handleExportCsv = () => {
        const columns = [
            { label: 'Nomor Surah', key: 'id' },
            { label: 'Nama Surah', key: 'nama_surah' },
            { label: 'Arti', key: 'arti' },
            { label: 'Jumlah Ayat', key: 'jumlah_ayat' },
            { label: 'Posisi Juz', key: 'posisi_juz' },
        ];
        exportToCsv('Katalog_Master_AlQuran', columns, filteredQuran);
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Katalog Master Al-Qur'an">
            <Head title="Master Al-Quran" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Filter & Toolbar */}
                <div className="p-5 bg-white border border-gray-200/80 shadow-sm rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📖</span>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">
                                    Daftar 114 Surah Al-Qur'anul Karim
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Standar rujukan resmi mushaf Al-Qur'an untuk pencatatan setoran & murojaah.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end">
                            {/* Switch View Mode */}
                            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                        viewMode === 'table'
                                            ? 'bg-white text-emerald-800 shadow-xs'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    📋 Tabel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                        viewMode === 'grid'
                                            ? 'bg-white text-emerald-800 shadow-xs'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    🗂️ Kartu
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleExportCsv}
                                className="px-3.5 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1.5"
                            >
                                <span>📥</span> Ekspor CSV
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Pencarian Nama Surah atau Arti
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    🔎
                                </span>
                                <input
                                    type="text"
                                    placeholder="Cari nama surah (cth: Al-Baqarah, Yasin)..."
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

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Filter Juz (1 - 30)
                            </label>
                            <select
                                value={filterJuz}
                                onChange={(e) => {
                                    setFilterJuz(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full text-xs py-2 border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="Semua">-- Seluruh Juz 1-30 --</option>
                                {juzOptions.map((j) => (
                                    <option key={j} value={j}>
                                        Juz {j}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Konten: Tabel atau Grid */}
                {viewMode === 'table' ? (
                    <div className="overflow-hidden bg-white border border-gray-200/80 shadow-sm rounded-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                            <h3 className="text-sm font-bold text-gray-800">
                                Tabel Surah Al-Qur'an ({filteredQuran.length})
                            </h3>
                            <span className="text-xs text-gray-400">
                                Halaman {currentPage} dari {Math.max(1, Math.ceil(filteredQuran.length / pageSize))}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold border-b border-gray-200">
                                    <tr>
                                        <th className="py-3 px-6 text-center w-20">No</th>
                                        <th className="py-3 px-6">Nama Surah</th>
                                        <th className="py-3 px-6">Arti Terjemahan</th>
                                        <th className="py-3 px-6 text-center">Jumlah Ayat</th>
                                        <th className="py-3 px-6">Posisi Juz</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedQuran.length > 0 ? (
                                        paginatedQuran.map((quran) => (
                                            <tr key={quran.id} className="hover:bg-emerald-50/40 transition-colors">
                                                <td className="py-3.5 px-6 text-center">
                                                    <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        {quran.id}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-6 font-bold text-gray-900 text-sm">
                                                    {quran.nama_surah}
                                                </td>
                                                <td className="py-3.5 px-6 text-gray-600 italic">
                                                    {quran.arti}
                                                </td>
                                                <td className="py-3.5 px-6 text-center font-semibold text-emerald-700">
                                                    {quran.jumlah_ayat} Ayat
                                                </td>
                                                <td className="py-3.5 px-6">
                                                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 text-gray-700 rounded-lg">
                                                        {quran.posisi_juz}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-12 text-center text-gray-400">
                                                Surah tidak ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <TablePagination
                            currentPage={currentPage}
                            totalItems={filteredQuran.length}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                            pageSizeOptions={[15, 20, 30, 50, 114]}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {paginatedQuran.map((quran) => (
                                <div
                                    key={quran.id}
                                    className="p-5 transition bg-white border border-gray-200/80 shadow-xs rounded-2xl hover:shadow-md hover:border-emerald-300"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center justify-center w-9 h-9 text-xs font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {quran.id}
                                        </div>
                                        <span className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-full">
                                            {quran.posisi_juz}
                                        </span>
                                    </div>
                                    <h4 className="text-base font-bold text-gray-900">{quran.nama_surah}</h4>
                                    <p className="text-xs italic text-gray-500 mt-0.5">{quran.arti}</p>
                                    <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                        <span className="font-semibold text-emerald-700">
                                            {quran.jumlah_ayat} Ayat
                                        </span>
                                        <span className="text-[11px] text-gray-400">Surah #{quran.id}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                            <TablePagination
                                currentPage={currentPage}
                                totalItems={filteredQuran.length}
                                pageSize={pageSize}
                                onPageChange={setCurrentPage}
                                onPageSizeChange={setPageSize}
                                pageSizeOptions={[12, 24, 36, 60, 114]}
                            />
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
