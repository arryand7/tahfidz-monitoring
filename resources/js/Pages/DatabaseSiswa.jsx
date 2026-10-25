import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function DatabaseSiswa({ auth, siswas }) {
    const [searchQuery, setSearchQuery] = useState('');

    // State Modal Upload
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // State & Form Inertia untuk Modal Tambah Siswa
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nis: '',
        nama: '',
        kelas: '',
        status: 'Aktif',
    });

    // --- TAMBAHKAN KODE INI DI BAWAHNYA ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSiswaId, setEditingSiswaId] = useState(null);

    // Handler Buka/Tutup Modal Edit
    const openEditModal = (siswa) => {
        setEditingSiswaId(siswa.id);
        setData({
            nis: siswa.nis,
            nama: siswa.nama,
            kelas: siswa.kelas,
            status: siswa.status,
        });
        clearErrors();
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingSiswaId(null);
        reset();
    };

    // Handler Submit Edit
    const submitEditForm = (e) => {
        e.preventDefault();
        put(route('master.siswa.update', editingSiswaId), {
            preserveScroll: true, // Agar halaman tidak meloncat ke atas saat disubmit
            onSuccess: () => {
                closeEditModal();
                alert('Data siswa berhasil diperbarui!');
            },
            onError: () => {
                alert('Gagal mengupdate data. Silakan periksa kembali isian Anda.');
            }
        });
    };

    // Handler Tombol Hapus
    const deleteSiswa = (id, nama) => {
        if (window.confirm(`Yakin ingin menghapus ${nama}? Semua riwayat setorannya juga akan terhapus permanen.`)) {
            router.delete(route('master.siswa.destroy', id));
        }
    };

    // Handler Modal Tambah Siswa
    const closeAddModal = () => {
        setIsAddModalOpen(false);
        reset(); // Kosongkan form saat ditutup
        clearErrors();
    };

    const submitAddForm = (e) => {
        e.preventDefault();
        post(route('master.siswa.store'), {
            onSuccess: () => closeAddModal(), // Tutup modal hanya jika sukses
        });
    };

    // --- TAMBAHKAN 2 FUNGSI INI KEMBALI ---
    // Handler ketika file dipilih di Modal
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            // SIMPAN OBJECT FILE ASLINYA (bukan cuma nama string)
            setSelectedFile(e.target.files[0]);
        }
    };

    const closeUploadModal = () => {
        setIsUploadModalOpen(false);
        setSelectedFile(null);
    };

    // FUNGSI BARU: Mengeksekusi pengiriman file ke Laravel
    const submitUploadForm = () => {
        if (!selectedFile) return;

        router.post(route('master.siswa.upload'), {
            file: selectedFile,
        }, {
            forceFormData: true, // Wajib dihidupkan untuk mengirim file (Multipart)
            onSuccess: () => {
                closeUploadModal();
                alert('Data siswa massal berhasil ditambahkan!');
            },
            onError: () => {
                alert('Gagal mengupload. Pastikan format file adalah .csv dan ukurannya di bawah 2MB.');
            }
        });
    };
    // -------------------------------------

    // Ubah dataSiswa menjadi siswas pada logika pencarian
    const filteredSiswa = siswas.filter(siswa =>
        siswa.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        siswa.nis.includes(searchQuery)
    );

    return (
        <AuthenticatedLayout user={auth.user} header="Manajemen Data Siswa">
            <Head title="Database Siswa" />

            <div className="space-y-6">

                {/* Header Section: Pencarian & Tombol Aksi */}
                <div className="flex flex-col items-center justify-between p-6 bg-white border border-gray-100 shadow-sm rounded-xl md:flex-row">
                    <div className="relative w-full md:w-1/2">
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

                    <div className="flex w-full mt-4 space-x-3 md:w-auto md:mt-0">
                        {/* Tombol Upload Massal */}
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium transition-colors border rounded-lg shadow-sm text-emerald-700 bg-emerald-50 border-emerald-200 md:w-auto hover:bg-emerald-100"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            Upload Data
                        </button>

                       {/* Tombol Tambah Satuan */}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg shadow-sm bg-emerald-600 md:w-auto hover:bg-emerald-700"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            Tambah Siswa
                        </button>
                    </div>
                </div>

                {/* Tabel Data Siswa */}
                <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase border-b border-gray-100 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4">NIS</th>
                                    <th className="px-6 py-4">Nama Lengkap</th>
                                    <th className="px-6 py-4">Kelas</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSiswa.map((siswa) => (
                                    <tr key={siswa.id} className="transition-colors bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{siswa.nis}</td>
                                        <td className="px-6 py-4 font-semibold text-emerald-700">{siswa.nama}</td>
                                        <td className="px-6 py-4">{siswa.kelas}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                siswa.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {siswa.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                {/* Tombol Edit */}
                                                <button onClick={() => openEditModal(siswa)} className="p-2 text-blue-600 transition-colors rounded bg-blue-50 hover:bg-blue-100" title="Edit Data">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                </button>
                                                {/* Tombol Hapus */}
                                                <button onClick={() => deleteSiswa(siswa.id, siswa.nama)} className="p-2 text-red-600 transition-colors rounded bg-red-50 hover:bg-red-100" title="Hapus Data">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredSiswa.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            Data siswa tidak ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* --- MODAL POPUP UPLOAD DATA --- */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="w-full max-w-md p-6 mx-4 bg-white shadow-xl rounded-xl animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Upload Data Siswa (Massal)</h3>
                            <button onClick={closeUploadModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <p className="mb-6 text-sm text-gray-500">
                            Tambahkan banyak siswa sekaligus menggunakan format Excel atau CSV.
                            <a href={route('siswa.template')} className="block mt-1 font-medium text-emerald-600 hover:underline">
                                &darr; Download Template Excel / CSV
                            </a>
                        </p>

                        {/* Area Drag & Drop / Pilih File */}
                        <div className="relative flex flex-col items-center justify-center p-6 mb-4 transition-colors border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 hover:border-emerald-400 group">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".csv, .xlsx"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <svg className="w-8 h-8 mb-2 text-gray-400 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            <span className="text-sm font-medium text-gray-700">Klik atau seret file ke sini</span>
                            <span className="mt-1 text-xs text-gray-500">Maksimal 2MB (.csv atau .xlsx)</span>
                        </div>

                        {/* Indikator File Terpilih */}
                        {selectedFile && (
                            <div className="flex items-center p-3 mb-6 border rounded-lg bg-emerald-50 border-emerald-100">
                                <svg className="flex-shrink-0 w-5 h-5 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span className="text-sm truncate text-emerald-800">{selectedFile.name}</span>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button onClick={closeUploadModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
                                Batal
                            </button>
                            <button
                                disabled={!selectedFile}
                                onClick={submitUploadForm}
                                className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            >
                                Proses Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}

           {/* --- MODAL POPUP TAMBAH SISWA MANUAL --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="w-full max-w-lg p-6 mx-4 bg-white shadow-xl rounded-xl animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Tambah Data Siswa Baru</h3>
                            <button onClick={closeAddModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form onSubmit={submitAddForm} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nomor Induk Siswa (NIS)</label>
                                <input
                                    type="text"
                                    value={data.nis}
                                    onChange={e => setData('nis', e.target.value)}
                                    placeholder="Contoh: 2026001"
                                    className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    required
                                />
                                {errors.nis && <div className="mt-1 text-xs text-red-500">{errors.nis}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={e => setData('nama', e.target.value)}
                                    placeholder="Masukkan nama lengkap siswa..."
                                    className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    required
                                />
                                {errors.nama && <div className="mt-1 text-xs text-red-500">{errors.nama}</div>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Kelas</label>
                                    <input
                                        type="text"
                                        value={data.kelas}
                                        onChange={e => setData('kelas', e.target.value)}
                                        placeholder="Contoh: X-IPA 1"
                                        className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                        required
                                    />
                                    {errors.kelas && <div className="mt-1 text-xs text-red-500">{errors.kelas}</div>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        value={data.status}
                                        onChange={e => setData('status', e.target.value)}
                                        className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-Aktif">Non-Aktif</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 mt-6 space-x-3 border-t border-gray-100">
                                <button type="button" onClick={closeAddModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing} className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                                    {processing ? 'Menyimpan...' : 'Simpan Siswa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL POPUP EDIT SISWA --- */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="w-full max-w-lg p-6 mx-4 bg-white shadow-xl rounded-xl animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Edit Data Siswa</h3>
                            <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form onSubmit={submitEditForm} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nomor Induk Siswa (NIS)</label>
                                <input type="text" value={data.nis} onChange={e => setData('nis', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                {errors.nis && <div className="mt-1 text-xs text-red-500">{errors.nis}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                                <input type="text" value={data.nama} onChange={e => setData('nama', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                {errors.nama && <div className="mt-1 text-xs text-red-500">{errors.nama}</div>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Kelas</label>
                                    <input type="text" value={data.kelas} onChange={e => setData('kelas', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                    {errors.kelas && <div className="mt-1 text-xs text-red-500">{errors.kelas}</div>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-Aktif">Non-Aktif</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 mt-6 space-x-3 border-t border-gray-100">
                                <button type="button" onClick={closeEditModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing} className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {processing ? 'Menyimpan...' : 'Update Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
