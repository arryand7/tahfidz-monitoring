import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TablePagination from '@/Components/TablePagination';
import { exportToCsv } from '@/Utils/exportCsv';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function KelolaUser({ auth, users }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

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
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const query = searchQuery.toLowerCase().trim();
            const matchSearch =
                !query ||
                user.name.toLowerCase().includes(query) ||
                (user.username && user.username.toLowerCase().includes(query)) ||
                (user.email && user.email.toLowerCase().includes(query));

            const matchRole = !roleFilter || user.role === roleFilter;
            const matchStatus = !statusFilter || user.status === statusFilter;

            return matchSearch && matchRole && matchStatus;
        });
    }, [users, searchQuery, roleFilter, statusFilter]);

    // Pagination
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredUsers.slice(start, start + pageSize);
    }, [filteredUsers, currentPage, pageSize]);

    // Ekspor CSV
    const handleExportCsv = () => {
        const columns = [
            { label: 'Username / NIS / NIP', key: 'username' },
            { label: 'Nama Lengkap', key: 'name' },
            { label: 'Email', key: 'email' },
            { label: 'Peran (Role)', key: 'role' },
            { label: 'Status', key: 'status' },
        ];
        exportToCsv(`Daftar_Pengguna_${roleFilter || 'Semua'}`, columns, filteredUsers);
    };

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
                onSuccess: () => {
                    closeModal();
                },
            });
        } else {
            post(route('kelola.user.store'), {
                onSuccess: () => {
                    closeModal();
                },
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
        if (
            window.confirm(
                'Generate akun otomatis untuk semua Siswa dan Ustadz? (Password default: sabira123)'
            )
        ) {
            router.post(
                route('kelola.user.generate'),
                {},
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        alert(
                            'Akun massal berhasil di-generate! Silakan beritahukan password default "sabira123" kepada user.'
                        ),
                }
            );
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'Ustadz':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Siswa':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const canManage = auth?.user?.role === 'Admin' || auth?.permissions?.['kelola_user'] === 'manage';

    return (
        <AuthenticatedLayout user={auth.user} header="Manajemen Akun Pengguna">
            <Head title="Kelola User" />

            <div className="max-w-7xl mx-auto space-y-6">
                {!canManage && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                        <span>👁️</span>
                        <span>
                            <strong>Mode Hanya Lihat (View Only):</strong> Anda memiliki izin melihat akun pengguna, namun tidak diizinkan membuat, mengedit, menghapus, atau generate akun massal.
                        </span>
                    </div>
                )}

                {/* Header Section: Pencarian, Filter & Tombol */}
                <div className="p-5 bg-white border border-gray-200/80 shadow-sm rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⚙️</span>
                            <h3 className="text-sm font-bold text-gray-800">
                                Manajemen Akun & Hak Akses
                            </h3>
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                                Total: {users.length} Akun
                            </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Link
                                href={route('kelola.hak-akses')}
                                className="flex items-center px-3.5 py-2 text-xs font-semibold text-emerald-800 transition-colors border border-emerald-200 rounded-xl bg-emerald-50 hover:bg-emerald-100"
                            >
                                <span className="mr-1.5">🛡️</span> Matriks Hak Akses
                            </Link>

                            <Link
                                href={route('sync.sso')}
                                className="flex items-center px-3.5 py-2 text-xs font-semibold text-purple-700 transition-colors border border-purple-200 rounded-xl bg-purple-50 hover:bg-purple-100"
                            >
                                <span className="mr-1.5">🔄</span> Gate SSO
                            </Link>

                            <button
                                type="button"
                                onClick={handleExportCsv}
                                className="px-3.5 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1.5"
                            >
                                <span>📥</span> Ekspor CSV ({filteredUsers.length})
                            </button>

                            {canManage && (
                                <>
                                    <button
                                        onClick={generateAccounts}
                                        className="flex items-center px-3.5 py-2 text-xs font-semibold transition-colors border rounded-xl text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100"
                                    >
                                        <span className="mr-1.5">⚡</span> Generate Massal
                                    </button>

                                    <button
                                        onClick={openAddModal}
                                        className="flex items-center px-4 py-2 text-xs font-bold text-white transition-colors rounded-xl shadow-xs bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <span className="mr-1.5">➕</span> Akun Baru
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Pencarian Nama, Username, atau Email
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    🔎
                                </span>
                                <input
                                    type="text"
                                    placeholder="Cari user..."
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
                                Filter Peran (Role)
                            </label>
                            <select
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full text-xs py-2 border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="">Semua Peran</option>
                                <option value="Admin">Admin</option>
                                <option value="Ustadz">Ustadz</option>
                                <option value="Siswa">Siswa / Santri</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Filter Status Akun
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full text-xs py-2 border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="">Semua Status</option>
                                <option value="Aktif">Aktif</option>
                                <option value="Non-Aktif">Non-Aktif</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabel User */}
                <div className="overflow-hidden bg-white border border-gray-200/80 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                        <h3 className="text-sm font-bold text-gray-800">
                            Daftar Akun Terdaftar ({filteredUsers.length})
                        </h3>
                        <span className="text-xs text-gray-400">
                            Halaman {currentPage} dari {Math.max(1, Math.ceil(filteredUsers.length / pageSize))}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-6">Username / NIS / NIP</th>
                                    <th className="py-3 px-6">Nama Pengguna</th>
                                    <th className="py-3 px-6">Email Terdaftar</th>
                                    <th className="py-3 px-6 text-center">Hak Akses</th>
                                    <th className="py-3 px-6 text-center">Status</th>
                                    {canManage && <th className="py-3 px-6 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedUsers.length > 0 ? (
                                    paginatedUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-emerald-50/40 transition-colors">
                                            <td className="py-4 px-6 font-mono font-medium text-gray-900">
                                                {u.username || '-'}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-gray-900 text-sm">
                                                {u.name}
                                            </td>
                                            <td className="py-4 px-6 text-gray-500">
                                                {u.email || '-'}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span
                                                    className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${getRoleBadge(
                                                        u.role
                                                    )}`}
                                                >
                                                    {u.role === 'Siswa' ? 'Santri' : u.role}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span
                                                    className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                                                        u.status === 'Aktif'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}
                                                >
                                                    {u.status}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => openEditModal(u)}
                                                            className="px-2.5 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition font-medium"
                                                            title="Edit Akun"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        {auth.user.id !== u.id && (
                                                            <button
                                                                onClick={() => deleteUser(u.id, u.name)}
                                                                className="px-2.5 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition font-medium"
                                                                title="Hapus Akun"
                                                            >
                                                                🗑️ Hapus
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={canManage ? 6 : 5} className="py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <span className="text-4xl">👥</span>
                                                <p className="text-sm font-medium text-gray-600">
                                                    Data user tidak ditemukan.
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
                        totalItems={filteredUsers.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        pageSizeOptions={[10, 15, 25, 50]}
                    />
                </div>
            </div>

            {/* Modal Tambah/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-gray-900">
                                {isEditMode ? 'Edit Akun Pengguna' : 'Buat Akun Pengguna Baru'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={submitForm} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                                    required
                                />
                                {errors.name && <div className="mt-1 text-red-500">{errors.name}</div>}
                            </div>
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">
                                    Username (NIS / NIP)
                                </label>
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                                    required
                                />
                                {errors.username && (
                                    <div className="mt-1 text-red-500">{errors.username}</div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Hak Akses (Role)
                                    </label>
                                    <select
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value)}
                                        className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Ustadz">Ustadz</option>
                                        <option value="Siswa">Siswa / Santri</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-Aktif">Non-Aktif</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Password{' '}
                                        {isEditMode && (
                                            <span className="text-[10px] text-gray-400 font-normal">
                                                (Opsional)
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder={
                                            isEditMode
                                                ? 'Kosongkan jika tidak diubah'
                                                : 'Minimal 8 karakter'
                                        }
                                        className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                                        required={!isEditMode}
                                    />
                                    {errors.password && (
                                        <div className="mt-1 text-red-500">{errors.password}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        Konfirmasi Password
                                    </label>
                                    <input
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                                        required={!isEditMode || data.password.length > 0}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-3 mt-4 space-x-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-xs font-bold text-white transition rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                                >
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
