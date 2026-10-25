import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

// Terima props siswas dan masterQuran dari Controller
export default function InputSetoran({ auth, siswas, masterQuran }) {

    // Inisialisasi Inertia useForm
    const { data, setData, post, processing, errors } = useForm({
        siswa_id: '',
        jenis: 'Hafalan',
        surah: '', // Menyimpan nama surah untuk dikirim ke DB
        ayat_awal: '',
        ayat_akhir: '',
        nilai: 'Baik',
        catatan: ''
    });

    // State UI untuk visual (tidak dikirim ke DB)
    const [selectedSurahId, setSelectedSurahId] = useState('');
    const [selectedJuz, setSelectedJuz] = useState('');
    const [maxAyat, setMaxAyat] = useState('');

    // Logika Auto-Fill saat Surah dipilih
    const handleSurahChange = (e) => {
        const surahId = parseInt(e.target.value);
        setSelectedSurahId(surahId);

        const surahData = masterQuran.find(s => s.id === surahId);

        if (surahData) {
            setSelectedJuz(surahData.posisi_juz);
            setMaxAyat(surahData.jumlah_ayat);
            // Simpan nama surahnya ke dalam data form yang akan di-POST
            setData('surah', surahData.nama_surah);
        } else {
            setSelectedJuz('');
            setMaxAyat('');
            setData('surah', '');
        }
    };

    // Handler ketika tombol Simpan ditekan
    const submitForm = (e) => {
        e.preventDefault();
        post(route('input.setoran.store'));
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Input Setoran Siswa">
            <Head title="Input Setoran" />

            <div className="max-w-4xl mx-auto bg-white border border-gray-100 shadow-sm rounded-xl">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900">Form Pencatatan Hafalan & Murojaah</h3>
                    <p className="mt-1 text-sm text-gray-500">Pilih siswa dan masukkan detail setoran dengan teliti.</p>
                </div>

                <form onSubmit={submitForm} className="p-6 space-y-6">
                    {/* Baris 1: Nama Siswa & Jenis */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Siswa</label>
                            <select
                                value={data.siswa_id}
                                onChange={e => setData('siswa_id', e.target.value)}
                                className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                required
                            >
                                <option value="">-- Pilih Siswa --</option>
                                {siswas.map((siswa) => (
                                    <option key={siswa.id} value={siswa.id}>
                                        {siswa.nis} - {siswa.nama}
                                    </option>
                                ))}
                            </select>
                            {errors.siswa_id && <div className="mt-1 text-xs text-red-500">{errors.siswa_id}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Jenis</label>
                            <div className="flex items-center mt-2 space-x-4">
                                <label className="flex items-center">
                                    <input type="radio" value="Hafalan" checked={data.jenis === 'Hafalan'} onChange={e => setData('jenis', e.target.value)} className="text-emerald-600 focus:ring-emerald-500" />
                                    <span className="ml-2 text-sm text-gray-700">Hafalan Baru</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" value="Murojaah" checked={data.jenis === 'Murojaah'} onChange={e => setData('jenis', e.target.value)} className="text-blue-600 focus:ring-blue-500" />
                                    <span className="ml-2 text-sm text-gray-700">Murojaah</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Baris 2: Surah & Juz */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Surah</label>
                            <select
                                value={selectedSurahId}
                                onChange={handleSurahChange}
                                className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                required
                            >
                                <option value="">-- Pilih Surah --</option>
                                {masterQuran.map((quran) => (
                                    <option key={quran.id} value={quran.id}>
                                        {quran.id}. {quran.nama_surah}
                                    </option>
                                ))}
                            </select>
                            {errors.surah && <div className="mt-1 text-xs text-red-500">{errors.surah}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Juz (Terisi Otomatis)</label>
                            <input
                                type="text"
                                value={selectedJuz}
                                disabled
                                placeholder="--"
                                className="w-full mt-1 border-gray-300 rounded-lg shadow-sm cursor-not-allowed bg-gray-50"
                            />
                        </div>
                    </div>

                    {/* Baris 3: Ayat Awal & Akhir */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ayat Awal</label>
                            <input
                                type="number" min="1" max={maxAyat}
                                value={data.ayat_awal}
                                onChange={e => setData('ayat_awal', e.target.value)}
                                placeholder="Contoh: 1"
                                className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Ayat Akhir {maxAyat && <span className="text-xs text-emerald-600">(Maks: {maxAyat})</span>}
                            </label>
                            <input
                                type="number" min="1" max={maxAyat}
                                value={data.ayat_akhir}
                                onChange={e => setData('ayat_akhir', e.target.value)}
                                placeholder={`Maksimal ayat: ${maxAyat || '...'}`}
                                className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                required
                            />
                        </div>
                    </div>

                    <hr className="border-gray-200" />

                    {/* Baris 4: Penilaian & Catatan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Penilaian / Keterangan</label>
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input type="radio" value="Baik" checked={data.nilai === 'Baik'} onChange={e => setData('nilai', e.target.value)} className="w-4 h-4 text-green-600 focus:ring-green-500" />
                                <span className="ml-2 text-sm font-medium text-green-700">Baik (Lancar)</span>
                            </label>
                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input type="radio" value="Cukup" checked={data.nilai === 'Cukup'} onChange={e => setData('nilai', e.target.value)} className="w-4 h-4 text-yellow-500 focus:ring-yellow-500" />
                                <span className="ml-2 text-sm font-medium text-yellow-700">Cukup (Ada Kesalahan)</span>
                            </label>
                            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input type="radio" value="Kurang" checked={data.nilai === 'Kurang'} onChange={e => setData('nilai', e.target.value)} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                                <span className="ml-2 text-sm font-medium text-red-700">Kurang (Belum Lancar)</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Catatan Ustadz (Opsional)</label>
                        <textarea
                            rows="3"
                            value={data.catatan}
                            onChange={e => setData('catatan', e.target.value)}
                            placeholder="Tambahkan catatan khusus..."
                            className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        ></textarea>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Setoran'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
