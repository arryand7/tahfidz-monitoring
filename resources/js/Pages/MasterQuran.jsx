import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function MasterQuran({ auth, quranList }) {
    const [searchQuery, setSearchQuery] = useState('');

    // HAPUS BLOK 'const dataQuran = [...]' DI SINI

    // Logika Pencarian: Bisa mencari berdasarkan nama surah, arti, atau posisi juz
    const filteredQuran = quranList.filter(quran =>
        quran.nama_surah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quran.arti.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quran.posisi_juz.toLowerCase().includes(searchQuery.toLowerCase())
    );

   return (
        <AuthenticatedLayout user={auth.user} header="Master Al-Quran">
            <Head title="Master Al-Quran" />

            <div className="space-y-6">

                {/* Header Section: Informasi & Pencarian */}
                <div className="flex flex-col items-start justify-between p-6 bg-white border border-gray-100 shadow-sm rounded-xl md:flex-row md:items-center">
                    <div className="mb-4 md:mb-0">
                        <h3 className="text-lg font-bold text-gray-900">Daftar 114 Surah</h3>
                        <p className="mt-1 text-sm text-gray-500">Data referensi baku untuk input setoran (Tidak dapat diubah).</p>
                    </div>

                    <div className="relative w-full md:w-72">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cari Surah, Arti, atau Juz..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 text-sm border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                {/* Grid List Surah */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredQuran.map((quran) => (
                        <div key={quran.id} className="p-5 transition-shadow bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center justify-center w-10 h-10 font-bold rounded-full bg-emerald-50 text-emerald-700">
                                    {quran.id}
                                </div>
                                <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                                    {quran.posisi_juz}
                                </span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">{quran.nama_surah}</h4>
                            <p className="text-sm italic text-gray-500">{quran.arti}</p>
                            <div className="pt-3 mt-3 border-t border-gray-100">
                                <span className="text-sm font-medium text-emerald-600">{quran.jumlah_ayat} Ayat</span>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredQuran.length === 0 && (
                    <div className="p-8 text-center bg-white border border-gray-100 shadow-sm rounded-xl">
                        <p className="text-gray-500">Surah tidak ditemukan.</p>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
