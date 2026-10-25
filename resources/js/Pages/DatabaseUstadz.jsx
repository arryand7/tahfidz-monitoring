import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TablePagination from '@/Components/TablePagination';
import { exportToCsv } from '@/Utils/exportCsv';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function DatabaseUstadz({ auth, ustadzs }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

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

    // Filter Logic
    const filteredUstadz = useMemo(() => {
        return ustadzs.filter((ustadz) => {
            const query = searchQuery.toLowerCase().trim();
            const matchSearch =
                !query ||
                ustadz.nama?.toLowerCase().includes(query) ||
                (ustadz.nip && ustadz.nip.toLowerCase().includes(query)) ||
                (ustadz.no_hp && ustadz.no_hp.includes(query));

            const matchStatus = filterStatus === 'Semua' || ustadz.status === filterStatus;

            return matchSearch && matchStatus;
        });
    }, [ustadzs, searchQuery, filterStatus]);

    // Data Terpotong Halaman
    const paginatedUstadz = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredUstadz.slice(start, start + pageSize);
    }, [filteredUstadz, currentPage, pageSize]);

    // Ekspor CSV
    const handleExportCsv = () => {
        const columns = [
            { label: 'NIP / ID', key: 'nip' },
            { label: 'Nama Lengkap', key: 'nama' },
            { label: 'No. Handphone', key: 'no_hp' },
            { label: 'Status', key: 'status' },
        ];
        exportToCsv('Database_Guru_Ustadz', columns, filteredUstadz);
    };

    // HANDLER UPLOAD
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
    };
    const closeUploadModal = () => {
        setIsUploadModalOpen(false);
        setSelectedFile(null);
    };
    const submitUploadForm = () => {
        if (!selectedFile) return;
        router.post(
            route('master.ustadz.upload'),
            { file: selectedFile },
            {
                forceFormData: true,
                onSuccess: () => {
                    closeUploadModal();
                },
                onError: () => alert('Gagal mengupload. Pastikan format file .csv.'),
            }
        );
    };

    // HANDLER TAMBAH
    const closeAddModal = () => {
        setIsAddModalOpen(false);
        reset();
        clearErrors();
    };
    const submitAddForm = (e) => {
        e.preventDefault();
        post(route('master.ustadz.store'), {
            onSuccess: () => closeAddModal(),
        });
    };

    // HANDLER EDIT
    const openEditModal = (ustadz) => {
        setEditingUstadzId(ustadz.id);
        setData({
            nip: ustadz.nip || '',
            nama: ustadz.nama,
            no_hp: ustadz.no_hp || '',
            status: ustadz.status,
        });
        clearErrors();
        setIsEditModalOpen(true);
    };
    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingUstadzId(null);
        reset();
    };
    const submitEditForm = (e) => {
        e.preventDefault();
        put(route('master.ustadz.update', editingUstadzId), {
            onSuccess: () => {
                closeEditModal();
            },
        });
    };

    // HANDLER HAPUS
    const deleteUstadz = (id, nama) => {
        if (window.confirm(`Yakin ingin menghapus Ustadz ${nama}?`)) {
            router.delete(route('master.ustadz.destroy', id));
        }
    };

    const canManage = auth?.user?.role === 'Admin' || auth?.permissions?.['master_ustadz'] === 'manage';
    const isAdmin = auth?.user?.role === 'Admin';

    // State Bulk Action (Khusus Admin)
    const [selectedUstadzIds, setSelectedUstadzIds] = useState([]);

    const pageUstadzIds = useMemo(() => paginatedUstadz.map((u) => u.id), [paginatedUstadz]);
    const isAllPageSelected = pageUstadzIds.length > 0 && pageUstadzIds.every((id) => selectedUstadzIds.includes(id));
    const isSomePageSelected = pageUstadzIds.some((id) => selectedUstadzIds.includes(id));

    const toggleSelectUstadz = (id) => {
        setSelectedUstadzIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAllPage = () => {
        if (isAllPageSelected) {
            setSelectedUstadzIds((prev) => prev.filter((id) => !pageUstadzIds.includes(id)));
        } else {
            setSelectedUstadzIds((prev) => Array.from(new Set([...prev, ...pageUstadzIds])));
        }
    };

    const selectAllFiltered = () => {
        setSelectedUstadzIds(filteredUstadz.map((u) => u.id));
    };

    const clearSelection = () => {
        setSelectedUstadzIds([]);
    };

    const handleBulkUpdateStatus = (status) => {
        if (!window.confirm(`Ubah status ${selectedUstadzIds.length} ustadz/pembimbing terpilih menjadi "${status}"?`)) {
            return;
        }

        router.post(
            route('master.ustadz.bulk-action'),
            {
                action: 'update_status',
                ids: selectedUstadzIds,
                status,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedUstadzIds([]);
                },
            }
        );
    };

    const handleBulkDelete = () => {
        if (
            !window.confirm(
                `PERINGATAN: Yakin ingin menghapus ${selectedUstadzIds.length} data ustadz/pembimbing terpilih? Data yang dihapus tidak dapat dipulihkan.`
            )
        ) {
            return;
        }

        router.post(
            route('master.ustadz.bulk-action'),
            {
                action: 'delete',
                ids: selectedUstadzIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedUstadzIds([]);
                },
            }
        );
    };

    const handleBulkExportCsv = () => {
        const selectedData = ustadzs.filter((u) => selectedUstadzIds.includes(u.id));
        const columns = [
            { label: 'NIP / ID', key: 'nip' },
            { label: 'Nama Lengkap', key: 'nama' },
            { label: 'No. Handphone', key: 'no_hp' },
            { label: 'Status', key: 'status' },
        ];
        exportToCsv(`Data_Ustadz_Terpilih_${selectedData.length}_Orang`, columns, selectedData);
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Database Guru & Pembimbing">
            <Head title="Database Ustadz" />

            <div className="max-w-7xl mx-auto space-y-6">
                {!canManage && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                        <span>👁️</span>
                        <span>
                            <strong>Mode Hanya Lihat (View Only):</strong> Anda memiliki izin melihat dan mengunduh data pembimbing/ustadz, namun tidak diizinkan menambah, mengedit, atau menghapus data.
                        </span>
                    </div>
                )}

                {/* Header & Filter Card */}
                <div className="p-5 bg-white border border-gray-200/80 shadow-sm rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">👨‍🏫</span>
                            <h3 className="text-sm font-bold text-gray-800">
                                Filter & Manajemen Pembimbing (Ustadz)
                            </h3>
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                                Total: {ustadzs.length} Guru
                            </span>
                        </div>

                        <div className="flex items-center gap-2.5 flex-wrap">
                            <button
                                type="button"
                                onClick={handleExportCsv}
                                className="px-3.5 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1.5"
                            >
                                <span>📥</span> Ekspor CSV ({filteredUstadz.length})
                            </button>
                            {canManage && (
                                <>
                                    <button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="flex items-center px-3.5 py-2 text-xs font-semibold transition-colors border rounded-xl text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                    >
                                        <span className="mr-1.5">📤</span> Upload CSV
                                    </button>
                                    <button
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="flex items-center px-4 py-2 text-xs font-bold text-white transition-colors rounded-xl shadow-xs bg-emerald-600 hover:bg-emerald-700"
                                    >
                                        <span className="mr-1.5">➕</span> Tambah Ustadz
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Pencarian Nama, NIP, atau No. HP
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    🔎
                                </span>
                                <input
                                    type="text"
                                    placeholder="Cari nama atau NIP ustadz..."
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
                                Status Mengajar
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full text-xs py-2 border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="Semua">Semua Status</option>
                                <option value="Aktif">Aktif</option>
                                <option value="Non-Aktif">Non-Aktif</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabel Ustadz */}
                <div className="overflow-hidden bg-white border border-gray-200/80 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                        <h3 className="text-sm font-bold text-gray-800">
                            Daftar Ustadz & Pembimbing ({filteredUstadz.length})
                        </h3>
                        <span className="text-xs text-gray-400">
                            Halaman {currentPage} dari {Math.max(1, Math.ceil(filteredUstadz.length / pageSize))}
                        </span>
                    </div>

                    {isAdmin && selectedUstadzIds.length > 0 && (
                        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-900">
                            <div className="flex items-center gap-2">
                                <span>✨ Terpilih <strong>{selectedUstadzIds.length}</strong> ustadz/pembimbing</span>
                                {selectedUstadzIds.length < filteredUstadz.length && (
                                    <button
                                        type="button"
                                        onClick={selectAllFiltered}
                                        className="font-bold underline text-emerald-700 hover:text-emerald-900 ml-2"
                                    >
                                        Pilih seluruh {filteredUstadz.length} ustadz hasil filter
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
                                    <th className="py-3 px-6">NIP / ID</th>
                                    <th className="py-3 px-6">Nama Ustadz</th>
                                    <th className="py-3 px-6">No. Handphone</th>
                                    <th className="py-3 px-6 text-center">Status</th>
                                    {canManage && <th className="py-3 px-6 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedUstadz.length > 0 ? (
                                    paginatedUstadz.map((ustadz) => (
                                        <tr key={ustadz.id} className={`hover:bg-emerald-50/40 transition-colors ${selectedUstadzIds.includes(ustadz.id) ? 'bg-emerald-50/50' : ''}`}>
                                            {isAdmin && (
                                                <td className="py-4 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                        checked={selectedUstadzIds.includes(ustadz.id)}
                                                        onChange={() => toggleSelectUstadz(ustadz.id)}
                                                    />
                                                </td>
                                            )}
                                            <td className="py-4 px-6 font-mono font-medium text-gray-900">
                                                {ustadz.nip || '-'}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-emerald-800 text-sm">
                                                {ustadz.nama}
                                            </td>
                                            <td className="py-4 px-6 text-gray-600">
                                                {ustadz.no_hp || '-'}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span
                                                    className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                                                        ustadz.status === 'Aktif'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}
                                                >
                                                    {ustadz.status}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => openEditModal(ustadz)}
                                                            className="px-2.5 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition font-medium"
                                                            title="Edit Data"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteUstadz(ustadz.id, ustadz.nama)}
                                                            className="px-2.5 py-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition font-medium"
                                                            title="Hapus Data"
                                                        >
                                                            🗑️ Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4 + (canManage ? 1 : 0) + (isAdmin ? 1 : 0)} className="py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <span className="text-4xl">👨‍🏫</span>
                                                <p className="text-sm font-medium text-gray-600">
                                                    Data ustadz tidak ditemukan.
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
                        totalItems={filteredUstadz.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        pageSizeOptions={[10, 15, 25, 50]}
                    />
                </div>
            </div>

            {/* Modal Tambah/Edit */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-gray-900">
                                {isEditModalOpen ? 'Edit Data Ustadz' : 'Tambah Ustadz Baru'}
                            </h3>
                            <button
                                onClick={isEditModalOpen ? closeEditModal : closeAddModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <form
                            onSubmit={isEditModalOpen ? submitEditForm : submitAddForm}
                            className="space-y-4 text-xs"
                        >
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">
                                    NIP / ID (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={data.nip}
                                    onChange={(e) => setData('nip', e.target.value)}
                                    className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                                    placeholder="Contoh: 19850101..."
                                />
                                {errors.nip && <div className="mt-1 text-red-500">{errors.nip}</div>}
                            </div>
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                                    placeholder="Masukkan nama lengkap ustadz..."
                                    required
                                />
                                {errors.nama && <div className="mt-1 text-red-500">{errors.nama}</div>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">
                                        No. Handphone / WA
                                    </label>
                                    <input
                                        type="text"
                                        value={data.no_hp}
                                        onChange={(e) => setData('no_hp', e.target.value)}
                                        className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                                        placeholder="08123456789"
                                    />
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
                            <div className="flex justify-end pt-3 mt-4 space-x-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={isEditModalOpen ? closeEditModal : closeAddModal}
                                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-xs font-bold text-white transition rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Upload */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-gray-900">Upload Data Ustadz (Massal)</h3>
                            <button onClick={closeUploadModal} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <p className="mb-4 text-xs text-gray-500">
                            Gunakan format CSV untuk import data guru.{' '}
                            <a
                                href={route('ustadz.template')}
                                className="block mt-1 font-semibold text-emerald-600 hover:underline"
                            >
                                ⬇ Download Template CSV
                            </a>
                        </p>
                        <div className="relative flex flex-col items-center justify-center p-6 mb-4 transition border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 hover:border-emerald-400 cursor-pointer">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".csv"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <span className="text-3xl mb-2">📁</span>
                            <span className="text-xs font-semibold text-gray-700">
                                Klik atau seret file CSV ke sini
                            </span>
                        </div>
                        {selectedFile && (
                            <div className="flex items-center p-3 mb-4 border rounded-xl bg-emerald-50 border-emerald-200 text-xs text-emerald-800">
                                <span className="mr-2">📄</span>
                                <span className="truncate font-medium">{selectedFile.name}</span>
                            </div>
                        )}
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={closeUploadModal}
                                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={submitUploadForm}
                                disabled={!selectedFile}
                                className="px-4 py-2 text-xs font-bold text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                            >
                                Proses Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FLOATING BULK ACTION BAR (Khusus Admin) */}
            {isAdmin && selectedUstadzIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl px-5 py-3 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-emerald-400 whitespace-nowrap">
                            {selectedUstadzIds.length} Ustadz Terpilih
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
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
                            onClick={handleBulkDelete}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                        >
                            <span>🗑️</span> Hapus Ustadz
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
        </AuthenticatedLayout>
    );
}
