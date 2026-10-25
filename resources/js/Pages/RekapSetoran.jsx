import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function RekapSetoran({ auth, siswas, semuaRiwayat }) {
    // 1. Deklarasi State untuk kedua Filter
    const [selectedSiswa, setSelectedSiswa] = useState('');
    const [filterWaktu, setFilterWaktu] = useState('Semua Waktu');

    // 2. Logika Filter Gabungan (Siswa & Waktu)
    const filteredRiwayat = semuaRiwayat.filter(item => {

        // A. Cek kecocokan Siswa
        // Jika selectedSiswa kosong, berarti lolos. Jika ada isinya, cek apakah ID-nya sama.
        const matchSiswa = selectedSiswa === '' || item.siswaId === parseInt(selectedSiswa);

        // B. Cek kecocokan Waktu
        let matchWaktu = true;
        if (filterWaktu !== 'Semua Waktu') {

            // Kita ubah teks "21 Jun 2026" menjadi format Waktu JavaScript
            const itemDate = new Date(item.tanggal);
            const todayDate = new Date();

            // Nol-kan jam, menit, detik agar perbandingan hanya fokus pada "Tanggal" saja
            itemDate.setHours(0, 0, 0, 0);
            todayDate.setHours(0, 0, 0, 0);

            if (filterWaktu === 'Hari Ini') {
                // Tanggal item harus persis sama dengan tanggal hari ini
                matchWaktu = itemDate.getTime() === todayDate.getTime();

            } else if (filterWaktu === 'Pekan Ini') {
                // Menghitung tanggal hari Senin di pekan ini
                const day = todayDate.getDay();
                const diffToMonday = todayDate.getDate() - day + (day === 0 ? -6 : 1);

                const startOfWeek = new Date(todayDate);
                startOfWeek.setDate(diffToMonday);

                // Menghitung tanggal hari Minggu di akhir pekan ini
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                // Tanggal item harus berada di antara Senin dan Minggu pekan ini
                matchWaktu = itemDate >= startOfWeek && itemDate <= endOfWeek;
            }
        }

        // C. Kembalikan true (tampilkan data) HANYA jika cocok dengan filter Siswa DAN Waktu
        return matchSiswa && matchWaktu;
    });

    return (
        <AuthenticatedLayout user={auth.user} header="Riwayat Keseluruhan Setoran">
            <Head title="Rekap Setoran" />

            <div className="space-y-6">

                {/* KOTAK FILTER */}
                <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                    <h3 className="mb-4 text-lg font-medium text-gray-900">Filter Log Setoran</h3>
                    <div className="flex flex-col items-end gap-4 md:flex-row">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-gray-700">Filter Nama / NIS</label>
                            <select
                                value={selectedSiswa}
                                onChange={(e) => setSelectedSiswa(e.target.value)}
                                className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="">-- Tampilkan Semua Siswa --</option>
                                {siswas.map(siswa => (
                                    <option key={siswa.id} value={siswa.id}>
                                        {siswa.nis} - {siswa.nama} ({siswa.kelas})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full md:w-64">
                            <label className="block text-sm font-medium text-gray-700">Filter Waktu</label>
                            <select
                                value={filterWaktu}
                                onChange={(e) => setFilterWaktu(e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-lg shadow-sm md:w-48 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="Semua Waktu">Semua Waktu</option>
                                <option value="Hari Ini">Hari Ini</option>
                                <option value="Pekan Ini">Pekan Ini</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* TABEL MASTER LOG */}
                <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-900">
                            {selectedSiswa || filterWaktu !== 'Semua Waktu' ? 'Menampilkan Filter Data' : 'Semua Riwayat Setoran'}
                        </h3>
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                            {filteredRiwayat.length} Data Ditemukan
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-white border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Tanggal</th>
                                    <th className="px-6 py-3">Nama Siswa</th>
                                    <th className="px-6 py-3">Pembimbing</th>
                                    <th className="px-6 py-3">Jenis</th>
                                    <th className="px-6 py-3">Surah / Juz</th>
                                    <th className="px-6 py-3">Ayat</th>
                                    <th className="px-6 py-3">Nilai</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRiwayat.length > 0 ? (
                                    filteredRiwayat.map((item) => (
                                        <tr key={item.id} className="transition-colors bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.tanggal}</td>
                                            <td className="px-6 py-4 font-semibold text-emerald-700">{item.namaSiswa}</td>
                                            <td className="px-6 py-4">{item.ustadz}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    item.jenis === 'Hafalan' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {item.jenis}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium">{item.surah}</td>
                                            <td className="px-6 py-4">{item.ayat}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    item.nilai === 'Baik' ? 'bg-green-100 text-green-800' :
                                                    item.nilai === 'Cukup' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {item.nilai}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            Tidak ada riwayat setoran yang ditemukan untuk filter tersebut.
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
