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
    const isAdmin = auth?.user?.role === 'Admin';

    // State Bulk Action (Khusus Admin)
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [isBulkRoleModalOpen, setIsBulkRoleModalOpen] = useState(false);
    const [bulkTargetRole, setBulkTargetRole] = useState('Ustadz');

    const selectablePageUserIds = useMemo(
        () => paginatedUsers.filter((u) => u.id !== auth.user.id).map((u) => u.id),
        [paginatedUsers, auth.user.id]
    );
    const isAllPageSelected =
        selectablePageUserIds.length > 0 &&
        selectablePageUserIds.every((id) => selectedUserIds.includes(id));
    const isSomePageSelected = selectablePageUserIds.some((id) => selectedUserIds.includes(id));

    const toggleSelectUser = (id) => {
        if (id === auth.user.id) return;
        setSelectedUserIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAllPage = () => {
        if (isAllPageSelected) {
            setSelectedUserIds((prev) => prev.filter((id) => !selectablePageUserIds.includes(id)));
        } else {
            setSelectedUserIds((prev) => Array.from(new Set([...prev, ...selectablePageUserIds])));
        }
    };

    const selectAllFiltered = () => {
        setSelectedUserIds(filteredUsers.filter((u) => u.id !== auth.user.id).map((u) => u.id));
    };

    const clearSelection = () => {
        setSelectedUserIds([]);
    };

    const handleBulkUpdateRole = (e) => {
        e.preventDefault();
        if (
            !window.confirm(
                `Ubah peran / hak akses ${selectedUserIds.length} akun pengguna terpilih menjadi "${bulkTargetRole}"?`
            )
        ) {
            return;
        }

        router.post(
            route('kelola.user.bulk-action'),
            {
                action: 'update_role',
                ids: selectedUserIds,
                role: bulkTargetRole,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedUserIds([]);
                    setIsBulkRoleModalOpen(false);
                },
            }
        );
    };

    const handleBulkUpdateStatus = (status) => {
        if (!window.confirm(`Ubah status ${selectedUserIds.length} akun terpilih menjadi "${status}"?`)) {
            return;
        }

        router.post(
            route('kelola.user.bulk-action'),
            {
                action: 'update_status',
                ids: selectedUserIds,
                status,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedUserIds([]);
                },
            }
        );
    };

    const handleBulkResetPassword = () => {
        if (
            !window.confirm(
                `Reset password ${selectedUserIds.length} akun terpilih menjadi default "sabira123"? Pengguna yang bersangkutan dapat login kembali dengan password tersebut.`
            )
        ) {
            return;
        }

        router.post(
            route('kelola.user.bulk-action'),
            {
                action: 'reset_password',
                ids: selectedUserIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedUserIds([]);
                    alert('Password akun terpilih berhasil direset menjadi "sabira123".');
                },
            }
        );
    };

    const handleBulkDelete = () => {
        if (
            !window.confirm(
                `PERINGATAN: Yakin ingin menghapus ${selectedUserIds.length} akun pengguna terpilih? Tindakan ini tidak dapat dibatalkan.`
            )
        ) {
            return;
        }

        router.post(
            route('kelola.user.bulk-action'),
            {
                action: 'delete',
                ids: selectedUserIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedUserIds([]);
                },
            }
        );
    };

    const handleBulkExportCsv = () => {
        const selectedData = users.filter((u) => selectedUserIds.includes(u.id));
        const columns = [
            { label: 'Username / NIS / NIP', key: 'username' },
            { label: 'Nama Lengkap', key: 'name' },
            { label: 'Email', key: 'email' },
            { label: 'Peran (Role)', key: 'role' },
            { label: 'Status', key: 'status' },
        ];
        exportToCsv(`Data_Pengguna_Terpilih_${selectedData.length}_Akun`, columns, selectedData);
    };

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

                    {isAdmin && selectedUserIds.length > 0 && (
                        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-900">
                            <div className="flex items-center gap-2">
                                <span>✨ Terpilih <strong>{selectedUserIds.length}</strong> akun pengguna</span>
                                {selectedUserIds.length < filteredUsers.filter((u) => u.id !== auth.user.id).length && (
                                    <button
                                        type="button"
                                        onClick={selectAllFiltered}
                                        className="font-bold underline text-emerald-700 hover:text-emerald-900 ml-2"
                                    >
                                        Pilih seluruh {filteredUsers.filter((u) => u.id !== auth.user.id).length} akun hasil filter
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={clearSelection}
                                className="text-gray-500 hover:text-red-600 font-medium"
                            >
                                Batalkan pilihan
                            </button>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold border-b border-gray-200">
                                <tr>
                                    {isAdmin && (
                                        <th className="py-3 px-4 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                checked={isAllPageSelected}
                                                ref={(el) => {
                                                    if (el) el.indeterminate = isSomePageSelected && !isAllPageSelected;
                                                }}
                                                onChange={toggleSelectAllPage}
                                                title="Pilih semua di halaman ini"
                                            />
                                        </th>
                                    )}
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
                                    paginatedUsers.map((u) => {
                                        const isSelf = auth.user.id === u.id;
                                        return (
                                            <tr key={u.id} className={`hover:bg-emerald-50/40 transition-colors ${selectedUserIds.includes(u.id) ? 'bg-emerald-50/50' : ''}`}>
                                                {isAdmin && (
                                                    <td className="py-4 px-4 text-center">
                                                        {isSelf ? (
                                                            <input
                                                                type="checkbox"
                                                                disabled
                                                                className="rounded border-gray-200 text-gray-300 cursor-not-allowed opacity-40"
                                                                title="Akun Anda sendiri tidak dapat dipilih untuk aksi massal demi keamanan"
                                                            />
                                                        ) : (
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                                checked={selectedUserIds.includes(u.id)}
                                                                onChange={() => toggleSelectUser(u.id)}
                                                            />
                                                        )}
                                                    </td>
                                                )}
                                                <td className="py-4 px-6 font-mono font-medium text-gray-900">
                                                    {u.username || '-'}
                                                </td>
                                                <td className="py-4 px-6 font-bold text-gray-900 text-sm">
                                                    {u.name}
                                                    {isSelf && (
                                                        <span className="ml-2 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                                            Anda
                                                        </span>
                                                    )}
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
                                                            {!isSelf && (
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
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5 + (canManage ? 1 : 0) + (isAdmin ? 1 : 0)} className="py-12 text-center text-gray-400">
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

            {/* FLOATING BULK ACTION BAR (Khusus Admin) */}
            {isAdmin && selectedUserIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl px-5 py-3 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-emerald-400 whitespace-nowrap">
                            {selectedUserIds.length} Akun Terpilih
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setIsBulkRoleModalOpen(true)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                        >
                            <span>👤</span> Ubah Peran
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkUpdateStatus('Aktif')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                        >
                            <span>✅</span> Set Aktif
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkUpdateStatus('Non-Aktif')}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                        >
                            <span>⏸️</span> Set Non-Aktif
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkResetPassword}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                            title="Reset password terpilih menjadi 'sabira123'"
                        >
                            <span>🔑</span> Reset Password
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkDelete}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                        >
                            <span>🗑️</span> Hapus Akun
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkExportCsv}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                        >
                            <span>📥</span> Export CSV
                        </button>
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-medium transition"
                            title="Batalkan Pilihan"
                        >
                            ✕ Batal
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL BULK UBAH PERAN */}
            {isBulkRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                            <span className="p-2.5 bg-purple-50 text-purple-700 rounded-xl text-xl">👤</span>
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Ubah Peran (Role) Massal</h3>
                                <p className="text-xs text-gray-500">
                                    Memperbarui hak akses untuk <strong>{selectedUserIds.length}</strong> akun terpilih.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleBulkUpdateRole} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Pilih Peran Baru
                                </label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'Admin', label: 'Admin (Akses Penuh Seluruh Sistem)', desc: 'Dapat mengelola santri, ustadz, user, dan setelan sistem.' },
                                        { value: 'Ustadz', label: 'Ustadz (Guru & Pembimbing)', desc: 'Dapat menginput setoran santri dan melihat rekap.' },
                                        { value: 'Siswa', label: 'Siswa / Santri', desc: 'Hanya dapat melihat capaian hafalan dan raport miliknya.' },
                                    ].map((r) => (
                                        <label
                                            key={r.value}
                                            className={`flex items-start p-3 border rounded-xl cursor-pointer transition ${
                                                bulkTargetRole === r.value
                                                    ? 'border-purple-500 bg-purple-50/50'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="bulkRole"
                                                value={r.value}
                                                checked={bulkTargetRole === r.value}
                                                onChange={(e) => setBulkTargetRole(e.target.value)}
                                                className="mt-0.5 text-purple-600 focus:ring-purple-500 border-gray-300"
                                            />
                                            <div className="ml-3">
                                                <span className="text-xs font-bold text-gray-900 block">
                                                    {r.label}
                                                </span>
                                                <span className="text-[11px] text-gray-500 block mt-0.5">
                                                    {r.desc}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsBulkRoleModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition"
                                >
                                    Terapkan Peran Baru
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
