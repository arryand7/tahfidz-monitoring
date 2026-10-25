import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function DatabaseUstadz({ auth, ustadzs }) {
    const [searchQuery, setSearchQuery] = useState('');

    // State Upload
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // State Edit
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUstadzId, setEditingUstadzId] = useState(null);

    // State & Form Tambah/Edit
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nip: '',
        nama: '',
        no_hp: '',
        status: 'Aktif',
    });

    // --- HANDLER PENCARIAN ---
    const filteredUstadz = ustadzs.filter(ustadz =>
        ustadz.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ustadz.nip && ustadz.nip.includes(searchQuery))
    );

    // --- HANDLER UPLOAD ---
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
    };
    const closeUploadModal = () => { setIsUploadModalOpen(false); setSelectedFile(null); };
    const submitUploadForm = () => {
        if (!selectedFile) return;
        router.post(route('master.ustadz.upload'), { file: selectedFile }, {
            forceFormData: true,
            onSuccess: () => { closeUploadModal(); alert('Data ustadz massal berhasil ditambahkan!'); },
            onError: () => alert('Gagal mengupload. Pastikan format file .csv.')
        });
    };

    // --- HANDLER TAMBAH ---
    const closeAddModal = () => { setIsAddModalOpen(false); reset(); clearErrors(); };
    const submitAddForm = (e) => {
        e.preventDefault();
        post(route('master.ustadz.store'), { onSuccess: () => closeAddModal() });
    };

    // --- HANDLER EDIT ---
    const openEditModal = (ustadz) => {
        setEditingUstadzId(ustadz.id);
        setData({ nip: ustadz.nip || '', nama: ustadz.nama, no_hp: ustadz.no_hp || '', status: ustadz.status });
        clearErrors();
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => { setIsEditModalOpen(false); setEditingUstadzId(null); reset(); };
    const submitEditForm = (e) => {
        e.preventDefault();
        put(route('master.ustadz.update', editingUstadzId), {
            onSuccess: () => { closeEditModal(); alert('Data ustadz berhasil diperbarui!'); }
        });
    };

    // --- HANDLER HAPUS ---
    const deleteUstadz = (id, nama) => {
        if (window.confirm(`Yakin ingin menghapus Ustadz ${nama}?`)) {
            router.delete(route('master.ustadz.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Manajemen Data Ustadz">
            <Head title="Database Ustadz" />

            <div className="space-y-6">
                {/* Header & Pencarian */}
                <div className="flex flex-col items-center justify-between p-6 bg-white border border-gray-100 shadow-sm rounded-xl md:flex-row">
                    <div className="relative w-full md:w-1/2">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input type="text" placeholder="Cari Nama atau NIP..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 text-sm border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500" />
                    </div>
                    <div className="flex w-full mt-4 space-x-3 md:w-auto md:mt-0">
                        <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium transition-colors border rounded-lg shadow-sm text-emerald-700 bg-emerald-50 border-emerald-200 md:w-auto hover:bg-emerald-100">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            Upload Data
                        </button>
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg shadow-sm bg-emerald-600 md:w-auto hover:bg-emerald-700">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            Tambah Ustadz
                        </button>
                    </div>
                </div>

                {/* Tabel Ustadz */}
                <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase border-b border-gray-100 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4">NIP/ID</th>
                                    <th className="px-6 py-4">Nama Ustadz</th>
                                    <th className="px-6 py-4">No. Handphone</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUstadz.map((ustadz) => (
                                    <tr key={ustadz.id} className="transition-colors bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{ustadz.nip || '-'}</td>
                                        <td className="px-6 py-4 font-semibold text-emerald-700">{ustadz.nama}</td>
                                        <td className="px-6 py-4">{ustadz.no_hp || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${ustadz.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {ustadz.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={() => openEditModal(ustadz)} className="p-2 text-blue-600 transition-colors rounded bg-blue-50 hover:bg-blue-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                                <button onClick={() => deleteUstadz(ustadz.id, ustadz.nama)} className="p-2 text-red-600 transition-colors rounded bg-red-50 hover:bg-red-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUstadz.length === 0 && (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Data ustadz tidak ditemukan.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Tambah/Edit (Digabung logikanya dengan kondisional) */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="w-full max-w-lg p-6 mx-4 bg-white shadow-xl rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">{isEditModalOpen ? 'Edit Data Ustadz' : 'Tambah Ustadz Baru'}</h3>
                            <button onClick={isEditModalOpen ? closeEditModal : closeAddModal} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                        <form onSubmit={isEditModalOpen ? submitEditForm : submitAddForm} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">NIP / ID (Opsional)</label>
                                <input type="text" value={data.nip} onChange={e => setData('nip', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500" />
                                {errors.nip && <div className="mt-1 text-xs text-red-500">{errors.nip}</div>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                                <input type="text" value={data.nama} onChange={e => setData('nama', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500" required />
                                {errors.nama && <div className="mt-1 text-xs text-red-500">{errors.nama}</div>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">No. Handphone</label>
                                    <input type="text" value={data.no_hp} onChange={e => setData('no_hp', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-Aktif">Non-Aktif</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 mt-6 space-x-3 border-t border-gray-100">
                                <button type="button" onClick={isEditModalOpen ? closeEditModal : closeAddModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                                <button type="submit" disabled={processing} className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                                    {processing ? 'Menyimpan...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Upload */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="w-full max-w-md p-6 mx-4 bg-white shadow-xl rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Upload Data Ustadz</h3>
                            <button onClick={closeUploadModal} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                        <p className="mb-6 text-sm text-gray-500">
                            Gunakan format CSV untuk import. <a href={route('ustadz.template')} className="block mt-1 font-medium text-emerald-600 hover:underline">&darr; Download Template CSV</a>
                        </p>
                        <div className="relative flex flex-col items-center justify-center p-6 mb-4 transition-colors border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 hover:border-emerald-400 group">
                            <input type="file" onChange={handleFileChange} accept=".csv, .txt" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <svg className="w-8 h-8 mb-2 text-gray-400 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            <span className="text-sm font-medium text-gray-700">Klik atau seret file CSV</span>
                        </div>
                        {selectedFile && <div className="flex items-center p-3 mb-6 border rounded-lg bg-emerald-50 border-emerald-100"><span className="text-sm truncate text-emerald-800">{selectedFile.name}</span></div>}
                        <div className="flex justify-end space-x-3">
                            <button onClick={closeUploadModal} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg">Batal</button>
                            <button onClick={submitUploadForm} disabled={!selectedFile} className="px-4 py-2 text-sm text-white rounded-lg bg-emerald-600 disabled:opacity-50">Proses Upload</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
