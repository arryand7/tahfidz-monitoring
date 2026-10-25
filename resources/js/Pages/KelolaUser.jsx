import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

export default function KelolaUser({ auth, users }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // State Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        username: '',
        role: 'Siswa',
        status: 'Aktif',
        password: '',
        password_confirmation: '',
    });

    // Logika Pencarian & Filter
    const filteredUsers = users.filter(user => {
        const matchSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchRole = roleFilter === '' || user.role === roleFilter;
        return matchSearch && matchRole;
    });

    // Handler Modal
    const openAddModal = () => {
        setIsEditMode(false);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setIsEditMode(true);
        setEditingUserId(user.id);
        setData({
            name: user.name,
            username: user.username || '',
            role: user.role,
            status: user.status,
            password: '',
            password_confirmation: '',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    // Handler Submit
    const submitForm = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(route('kelola.user.update', editingUserId), {
                onSuccess: () => { closeModal(); alert('Akun berhasil diperbarui!'); }
            });
        } else {
            post(route('kelola.user.store'), {
                onSuccess: () => { closeModal(); alert('Akun baru berhasil dibuat!'); }
            });
        }
    };

    // Handler Hapus
    const deleteUser = (id, name) => {
        if (window.confirm(`Yakin ingin menghapus akun ${name} secara permanen?`)) {
            router.delete(route('kelola.user.destroy', id));
        }
    };

    // Handler Generate Akun Otomatis
    const generateAccounts = () => {
        if (window.confirm('Generate akun otomatis untuk semua Siswa dan Ustadz? (Password default: sabira123)')) {
            router.post(route('kelola.user.generate'), {}, {
                preserveScroll: true,
                onSuccess: () => alert('Akun massal berhasil di-generate! Silakan beritahukan password default "sabira123" kepada user.')
            });
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Manajemen Akun Pengguna">
            <Head title="Kelola User" />

            <div className="space-y-6">
                {/* Header Section: Pencarian, Filter & Tombol */}
                <div className="flex flex-col gap-4 p-6 bg-white border border-gray-100 shadow-sm rounded-xl md:flex-row md:items-center">
                    <div className="relative w-full md:flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input type="text" placeholder="Cari Nama atau Username..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 text-sm border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500" />
                    </div>
                    <div className="w-full md:w-56">
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                            <option value="">Semua Hak Akses</option>
                            <option value="Admin">Admin</option>
                            <option value="Ustadz">Ustadz</option>
                            <option value="Siswa">Siswa</option>
                        </select>
                    </div>
                    <div className="flex flex-col w-full gap-2 md:w-auto md:flex-row">
                        {/* Tombol Generate Massal */}
                        <button onClick={generateAccounts} className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium transition-colors border rounded-lg shadow-sm text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 md:w-auto">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            Generate Otomatis
                        </button>

                        {/* Tombol Tambah Manual */}
                        <button onClick={openAddModal} className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700 md:w-auto">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            Buat Akun Baru
                        </button>
                    </div>
                </div>

                {/* Tabel User */}
                <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase border-b border-gray-100 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4">Username</th>
                                    <th className="px-6 py-4">Nama Pengguna</th>
                                    <th className="px-6 py-4 text-center">Hak Akses</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="transition-colors bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{u.username || '-'}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-700">{u.name}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                                u.role === 'Ustadz' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                            }`}>{u.role}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={() => openEditModal(u)} className="p-2 text-blue-600 transition-colors rounded bg-blue-50 hover:bg-blue-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                                {/* Cegah admin menghapus dirinya sendiri */}
                                                {auth.user.id !== u.id && (
                                                    <button onClick={() => deleteUser(u.id, u.name)} className="p-2 text-red-600 transition-colors rounded bg-red-50 hover:bg-red-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Tambah/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="w-full max-w-lg p-6 mx-4 bg-white shadow-xl rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">{isEditMode ? 'Edit Akun' : 'Buat Akun Baru'}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                        <form onSubmit={submitForm} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500" required />
                                {errors.name && <div className="mt-1 text-xs text-red-500">{errors.name}</div>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Username (NIS/NIP)</label>
                                <input type="text" value={data.username} onChange={e => setData('username', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500" required />
                                {errors.username && <div className="mt-1 text-xs text-red-500">{errors.username}</div>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Hak Akses</label>
                                    <select value={data.role} onChange={e => setData('role', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                                        <option value="Admin">Admin</option>
                                        <option value="Ustadz">Ustadz</option>
                                        <option value="Siswa">Siswa</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500">
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-Aktif">Non-Aktif</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Password {isEditMode && <span className="text-xs text-gray-400">(Opsional)</span>}
                                    </label>
                                    <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} placeholder={isEditMode ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500" required={!isEditMode} />
                                    {errors.password && <div className="mt-1 text-xs text-red-500">{errors.password}</div>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Konfirmasi Password</label>
                                    <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} className="w-full mt-1 border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500" required={!isEditMode || data.password.length > 0} />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 mt-6 space-x-3 border-t border-gray-100">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
                                <button type="submit" disabled={processing} className="px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50">
                                    {processing ? 'Menyimpan...' : 'Simpan Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
