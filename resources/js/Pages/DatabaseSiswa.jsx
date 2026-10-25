import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TablePagination from '@/Components/TablePagination';
import { exportToCsv } from '@/Utils/exportCsv';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { useState, useMemo, useRef } from 'react';
import axios from 'axios';

export default function DatabaseSiswa({ auth, siswas }) {
    const { flash } = usePage().props;

    // State Filter & Pencarian
    const [searchQuery, setSearchQuery] = useState('');
    const [filterKelas, setFilterKelas] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');

    // State Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);

    // State Dry Run & Import File
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoadingDryRun, setIsLoadingDryRun] = useState(false);
    const [dryRunData, setDryRunData] = useState(null);
    const [dryRunTab, setDryRunTab] = useState('all'); // 'all', 'new', 'update', 'same', 'invalid'
    const [selectedRowIds, setSelectedRowIds] = useState({});
    const [isApplyingImport, setIsApplyingImport] = useState(false);

    // State Modal Tambah Siswa Manual
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nis: '',
        nama: '',
        kelas: '',
        status: 'Aktif',
    });

    // State Modal Edit Siswa
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSiswaId, setEditingSiswaId] = useState(null);

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

    const submitEditForm = (e) => {
        e.preventDefault();
        put(route('master.siswa.update', editingSiswaId), {
            preserveScroll: true,
            onSuccess: () => {
                closeEditModal();
            },
            onError: () => {
                alert('Gagal mengupdate data. Silakan periksa kembali isian Anda.');
            },
        });
    };

    const deleteSiswa = (id, nama) => {
        if (
            window.confirm(
                `Yakin ingin menghapus ${nama}? Semua riwayat setorannya juga akan terhapus permanen.`
            )
        ) {
            router.delete(route('master.siswa.destroy', id));
        }
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        reset();
        clearErrors();
    };

    const submitAddForm = (e) => {
        e.preventDefault();
        post(route('master.siswa.store'), {
            onSuccess: () => closeAddModal(),
        });
    };

    // Ekstraksi kelas unik untuk dropdown
    const kelasList = useMemo(() => {
        const set = new Set();
        siswas.forEach((s) => {
            if (s.kelas) set.add(s.kelas);
        });
        return Array.from(set).sort();
    }, [siswas]);

    // Filter Logic untuk tabel data siswa
    const filteredSiswa = useMemo(() => {
        return siswas.filter((siswa) => {
            const query = searchQuery.toLowerCase().trim();
            const matchSearch =
                !query ||
                siswa.nama?.toLowerCase().includes(query) ||
                siswa.nis?.toLowerCase().includes(query);

            const matchKelas = !filterKelas || siswa.kelas === filterKelas;
            const matchStatus = filterStatus === 'Semua' || siswa.status === filterStatus;

            return matchSearch && matchKelas && matchStatus;
        });
    }, [siswas, searchQuery, filterKelas, filterStatus]);

    // Data Terpotong Halaman
    const paginatedSiswa = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredSiswa.slice(start, start + pageSize);
    }, [filteredSiswa, currentPage, pageSize]);

    // Export CSV
    const handleExportCsv = () => {
        const columns = [
            { label: 'NIS', key: 'nis' },
            { label: 'Nama Lengkap', key: 'nama' },
            { label: 'Kelas', key: 'kelas' },
            { label: 'Status', key: 'status' },
        ];
        exportToCsv(`Database_Santri_${filterKelas || 'Semua'}`, columns, filteredSiswa);
    };

    const resetFilters = () => {
        setSearchQuery('');
        setFilterKelas('');
        setFilterStatus('Semua');
        setCurrentPage(1);
    };

    const hasActiveFilter = Boolean(searchQuery) || Boolean(filterKelas) || filterStatus !== 'Semua';
    const canManage = auth?.user?.role === 'Admin' || auth?.permissions?.['master_siswa'] === 'manage';

    // Handler Unggah & Dry-Run
    const handleUploadAndDryRun = async () => {
        if (!selectedFile) {
            alert('Silakan pilih file CSV/TXT terlebih dahulu.');
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
            return;
        }

        setIsLoadingDryRun(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post(route('master.siswa.dry-run'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data && response.data.success) {
                setDryRunData(response.data);
                // Default centang otomatis semua baris baru dan update (merger)
                const initialSelected = {};
                response.data.items.forEach((item) => {
                    if (item.action === 'new' || item.action === 'update') {
                        initialSelected[item.id] = true;
                    }
                });
                setSelectedRowIds(initialSelected);
                setDryRunTab('all');
            } else {
                alert(response.data?.message || 'Gagal menganalisis file.');
            }
        } catch (err) {
            const errorMsg =
                err.response?.data?.message ||
                err.message ||
                'Terjadi kesalahan saat memproses dry-run.';
            alert(errorMsg);
        } finally {
            setIsLoadingDryRun(false);
        }
    };

    // Filter items dalam Dry Run Modal
    const filteredDryRunItems = useMemo(() => {
        if (!dryRunData?.items) return [];
        if (dryRunTab === 'all') return dryRunData.items;
        return dryRunData.items.filter((item) => item.action === dryRunTab);
    }, [dryRunData, dryRunTab]);

    // Hitung jumlah item valid yang dicentang
    const selectedDryRunCount = useMemo(() => {
        if (!dryRunData?.items) return 0;
        return dryRunData.items.filter(
            (item) => selectedRowIds[item.id] && item.action !== 'invalid'
        ).length;
    }, [dryRunData, selectedRowIds]);

    const isAllFilteredSelected = useMemo(() => {
        const validItems = filteredDryRunItems.filter((i) => i.action !== 'invalid');
        return validItems.length > 0 && validItems.every((i) => selectedRowIds[i.id]);
    }, [filteredDryRunItems, selectedRowIds]);

    // Batch toggle helpers di Dry Run Modal
    const toggleDryRunRow = (id) => {
        setSelectedRowIds((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const selectAllVisibleDryRun = () => {
        setSelectedRowIds((prev) => {
            const next = { ...prev };
            filteredDryRunItems.forEach((item) => {
                if (item.action !== 'invalid') {
                    next[item.id] = true;
                }
            });
            return next;
        });
    };

    const selectOnlyNewAndUpdate = () => {
        setSelectedRowIds((prev) => {
            const next = { ...prev };
            dryRunData.items.forEach((item) => {
                next[item.id] = item.action === 'new' || item.action === 'update';
            });
            return next;
        });
    };

    const deselectAllDryRun = () => {
        setSelectedRowIds({});
    };

    // Eksekusi Terapkan Import & Merger
    const handleApplyImport = async () => {
        if (!dryRunData || !dryRunData.items) return;

        const itemsToApply = dryRunData.items
            .filter((item) => selectedRowIds[item.id] && item.action !== 'invalid')
            .map((item) => ({
                nis: item.nis,
                nama: item.nama,
                kelas: item.kelas,
                status: item.status,
            }));

        if (itemsToApply.length === 0) {
            alert('Silakan centang setidaknya satu santri untuk diimport / dimerge.');
            return;
        }

        const confirmMsg = `Apakah Anda yakin ingin menerapkan ${itemsToApply.length} data santri terpilih ke database?\n\n- Data santri baru akan ditambahkan.\n- Data santri lama dengan NIS yang sama akan diperbarui (dimerge).\n- Profil akun santri (jika ada) akan disinkronkan otomatis.`;

        if (!window.confirm(confirmMsg)) {
            return;
        }

        setIsApplyingImport(true);
        try {
            const response = await axios.post(route('master.siswa.apply-import'), {
                items: itemsToApply,
            });

            if (response.data && response.data.success) {
                alert(response.data.message);
                setDryRunData(null);
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                router.reload({ preserveScroll: true });
            } else {
                alert(response.data?.message || 'Gagal menerapkan import santri.');
            }
        } catch (err) {
            const errorMsg =
                err.response?.data?.message ||
                err.message ||
                'Gagal menerapkan import santri.';
            alert(errorMsg);
        } finally {
            setIsApplyingImport(false);
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Database Master Santri">
            <Head title="Database Siswa" />

            <div className="max-w-7xl mx-auto space-y-5">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm flex items-center gap-3 shadow-xs">
                        <span className="text-xl">✅</span>
                        <div className="font-semibold">{flash.success}</div>
                    </div>
                )}

                {/* View-Only Banner */}
                {!canManage && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2 shadow-xs">
                        <span className="text-base">👁️</span>
                        <span>
                            <strong>Mode Hanya Lihat (View Only):</strong> Anda memiliki izin melihat dan mengunduh data santri, namun tidak diizinkan menambah, mengedit, atau mengimpor data santri.
                        </span>
                    </div>
                )}

                {/* Toolbar Bagian Atas Sesuai Desain Target */}
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
                    {/* Sisi Kiri: Tambah Santri, Template Import, Export Data */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {canManage && (
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 shadow-xs transition"
                            >
                                <span>➕</span>
                                <span>Tambah Santri</span>
                            </button>
                        )}

                        <a
                            href={route('siswa.template')}
                            download
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs transition"
                            title="Unduh Template CSV untuk Import Santri"
                        >
                            <span className="text-gray-500">📄</span>
                            <span>Template Import</span>
                        </a>

                        <button
                            type="button"
                            onClick={handleExportCsv}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs transition"
                            title="Ekspor Data Santri ke CSV"
                        >
                            <span className="text-gray-500">↗️</span>
                            <span>Export Data</span>
                        </button>
                    </div>

                    {/* Sisi Kanan: Wadah Import / Update & Tombol Upload & Dry Run */}
                    {canManage && (
                        <div className="flex items-center border border-gray-300 bg-white rounded-lg p-1.5 shadow-xs gap-2 flex-wrap sm:flex-nowrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-800 px-2 select-none whitespace-nowrap">
                                Import / Update
                            </span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.txt"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border file:border-gray-300 file:text-xs file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 cursor-pointer max-w-[210px] sm:max-w-xs"
                            />
                            <button
                                type="button"
                                onClick={handleUploadAndDryRun}
                                disabled={isLoadingDryRun}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-lg transition shadow-xs disabled:opacity-50 whitespace-nowrap cursor-pointer"
                            >
                                {isLoadingDryRun ? (
                                    <>
                                        <span className="inline-block animate-spin">⏳</span>
                                        <span>Menganalisis...</span>
                                    </>
                                ) : (
                                    <span>Upload & Dry Run</span>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Filter Bar (Baris Bawah) dengan Tombol Filter Gelap */}
                <div className="p-4 bg-white border border-gray-200/80 shadow-xs rounded-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                        {/* Pencarian Nama / NIS */}
                        <div className="lg:col-span-5">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Pencarian Nama atau NIS
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    🔎
                                </span>
                                <input
                                    type="text"
                                    placeholder="Ketik nama atau NIS santri..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-9 pr-8 text-xs py-2 border-gray-300 rounded-lg focus:ring-slate-900 focus:border-slate-900"
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

                        {/* Filter Kelas */}
                        <div className="lg:col-span-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Filter Kelas
                            </label>
                            <select
                                value={filterKelas}
                                onChange={(e) => {
                                    setFilterKelas(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full text-xs py-2 border-gray-300 rounded-lg focus:ring-slate-900 focus:border-slate-900"
                            >
                                <option value="">-- Semua Kelas --</option>
                                {kelasList.map((k) => (
                                    <option key={k} value={k}>
                                        {k}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Filter Status */}
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Status Santri
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full text-xs py-2 border-gray-300 rounded-lg focus:ring-slate-900 focus:border-slate-900"
                            >
                                <option value="Semua">Semua Status</option>
                                <option value="Aktif">Aktif</option>
                                <option value="Non-Aktif">Non-Aktif</option>
                            </select>
                        </div>

                        {/* Tombol Filter & Reset */}
                        <div className="lg:col-span-2 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(1)}
                                className="flex-1 py-2 px-4 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <span>Filter</span>
                            </button>
                            {hasActiveFilter && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="py-2 px-3 text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-300 transition"
                                    title="Reset Filter"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabel Data Siswa */}
                <div className="overflow-hidden bg-white border border-gray-200/80 shadow-xs rounded-xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-800">
                                Daftar Santri Terdaftar ({filteredSiswa.length})
                            </h3>
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                                Total: {siswas.length}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500">
                            Halaman {currentPage} dari {Math.max(1, Math.ceil(filteredSiswa.length / pageSize))}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-6">NIS</th>
                                    <th className="py-3 px-6">Nama Lengkap</th>
                                    <th className="py-3 px-6">Kelas</th>
                                    <th className="py-3 px-6 text-center">Status</th>
                                    {canManage && <th className="py-3 px-6 text-right">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedSiswa.length > 0 ? (
                                    paginatedSiswa.map((siswa) => (
                                        <tr key={siswa.id} className="hover:bg-emerald-50/40 transition-colors">
                                            <td className="py-4 px-6 font-mono font-bold text-gray-900">
                                                {siswa.nis}
                                            </td>
                                            <td className="py-4 px-6 font-bold text-emerald-800 text-sm">
                                                {siswa.nama}
                                            </td>
                                            <td className="py-4 px-6 font-medium text-gray-700">
                                                <span className="px-2.5 py-1 bg-gray-100 rounded-md">
                                                    {siswa.kelas || '-'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span
                                                    className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                                                        siswa.status === 'Aktif'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}
                                                >
                                                    {siswa.status}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => openEditModal(siswa)}
                                                            className="px-2.5 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition font-medium"
                                                            title="Edit Data"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteSiswa(siswa.id, siswa.nama)}
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
                                        <td colSpan={canManage ? 5 : 4} className="py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <span className="text-4xl">👥</span>
                                                <p className="text-sm font-medium text-gray-600">
                                                    Data santri tidak ditemukan.
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
                        totalItems={filteredSiswa.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        pageSizeOptions={[10, 15, 25, 50, 100]}
                    />
                </div>
            </div>

            {/* MODAL POPUP DRY RUN & REKONSILIASI / MERGER */}
            {dryRunData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
                    <div className="w-full max-w-5xl bg-white shadow-2xl rounded-2xl border border-gray-100 flex flex-col max-h-[92vh] animate-fade-in-up">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-gray-50/60 rounded-t-2xl">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xl">🧪</span>
                                    <h3 className="text-base font-bold text-gray-900">
                                        Hasil Dry-Run Import & Merger Santri
                                    </h3>
                                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                        📄 {dryRunData.filename}
                                    </span>
                                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                        🔑 Acuan Utama: NIS Santri
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Tinjau hasil analisis rekonsiliasi data santri sebelum diterapkan ke database. Data dengan NIS sama akan dimerge/diperbarui.
                                </p>
                            </div>
                            <button
                                onClick={() => setDryRunData(null)}
                                className="text-gray-400 hover:text-gray-600 text-base font-bold p-1 rounded-md"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body: Ringkasan Kartu & Filter */}
                        <div className="p-5 overflow-y-auto space-y-4">
                            {/* Kartu Ringkasan Status */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                        Total di File
                                    </div>
                                    <div className="mt-1 text-2xl font-black text-gray-900">
                                        {dryRunData.summary.total}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">Baris data terdeteksi</div>
                                </div>

                                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                                        ✨ Santri Baru
                                    </div>
                                    <div className="mt-1 text-2xl font-black text-emerald-800">
                                        {dryRunData.summary.new}
                                    </div>
                                    <div className="text-[10px] text-emerald-600 mt-0.5">Akan ditambahkan</div>
                                </div>

                                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                                        🔄 Merger / Update
                                    </div>
                                    <div className="mt-1 text-2xl font-black text-blue-800">
                                        {dryRunData.summary.update}
                                    </div>
                                    <div className="text-[10px] text-blue-600 mt-0.5">NIS cocok, profil berubah</div>
                                </div>

                                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                                    <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                                        ✔️ Identik (Sama)
                                    </div>
                                    <div className="mt-1 text-2xl font-black text-gray-700">
                                        {dryRunData.summary.same}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">Sudah sesuai database</div>
                                </div>

                                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl col-span-2 sm:col-span-1">
                                    <div className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
                                        ❌ Baris Invalid
                                    </div>
                                    <div className="mt-1 text-2xl font-black text-red-800">
                                        {dryRunData.summary.invalid}
                                    </div>
                                    <div className="text-[10px] text-red-600 mt-0.5">Duplikat / Data kosong</div>
                                </div>
                            </div>

                            {/* Toolbar Filter Tab & Batch Selection */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                                {/* Tab Filter Kategori */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setDryRunTab('all')}
                                        className={`px-3 py-1.5 font-semibold rounded-lg transition whitespace-nowrap ${
                                            dryRunTab === 'all'
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        Semua ({dryRunData.items.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDryRunTab('new')}
                                        className={`px-3 py-1.5 font-semibold rounded-lg transition whitespace-nowrap ${
                                            dryRunTab === 'new'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                        }`}
                                    >
                                        ✨ Santri Baru ({dryRunData.summary.new})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDryRunTab('update')}
                                        className={`px-3 py-1.5 font-semibold rounded-lg transition whitespace-nowrap ${
                                            dryRunTab === 'update'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                        }`}
                                    >
                                        🔄 Merger / Update ({dryRunData.summary.update})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDryRunTab('same')}
                                        className={`px-3 py-1.5 font-semibold rounded-lg transition whitespace-nowrap ${
                                            dryRunTab === 'same'
                                                ? 'bg-gray-700 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        ✔️ Identik ({dryRunData.summary.same})
                                    </button>
                                    {dryRunData.summary.invalid > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setDryRunTab('invalid')}
                                            className={`px-3 py-1.5 font-semibold rounded-lg transition whitespace-nowrap ${
                                                dryRunTab === 'invalid'
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                                            }`}
                                        >
                                            ❌ Invalid ({dryRunData.summary.invalid})
                                        </button>
                                    )}
                                </div>

                                {/* Opsi Centang Massal */}
                                <div className="flex items-center gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={isAllFilteredSelected ? deselectAllDryRun : selectAllVisibleDryRun}
                                        className="px-2.5 py-1 font-medium border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 transition"
                                    >
                                        {isAllFilteredSelected ? 'Batalkan Tab Ini' : 'Pilih Tab Ini'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={selectOnlyNewAndUpdate}
                                        className="px-2.5 py-1 font-semibold border border-emerald-300 bg-emerald-50 text-emerald-800 rounded-md hover:bg-emerald-100 transition"
                                    >
                                        Pilih Baru & Merger
                                    </button>
                                    <button
                                        type="button"
                                        onClick={deselectAllDryRun}
                                        className="px-2 py-1 text-gray-500 hover:text-gray-700"
                                    >
                                        Kosongkan
                                    </button>
                                </div>
                            </div>

                            {/* Tabel Hasil Dry Run */}
                            <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-200">
                                        <tr>
                                            <th className="w-10 px-3 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllFilteredSelected}
                                                    onChange={isAllFilteredSelected ? deselectAllDryRun : selectAllVisibleDryRun}
                                                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                                />
                                            </th>
                                            <th className="w-16 px-3 py-3 text-center">Baris</th>
                                            <th className="px-4 py-3">NIS (Acuan)</th>
                                            <th className="px-4 py-3">Nama Santri</th>
                                            <th className="px-4 py-3">Kelas</th>
                                            <th className="px-3 py-3 text-center">Status</th>
                                            <th className="px-4 py-3 text-center">Aksi Rekonsiliasi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredDryRunItems.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="py-8 text-center text-gray-400">
                                                    Tidak ada data santri dalam kategori ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredDryRunItems.map((item) => {
                                                const isSelected = !!selectedRowIds[item.id];
                                                const isInvalid = item.action === 'invalid';

                                                return (
                                                    <tr
                                                        key={item.id}
                                                        className={`transition-colors ${
                                                            isInvalid
                                                                ? 'bg-red-50/40 text-red-900'
                                                                : isSelected
                                                                ? 'bg-emerald-50/40 hover:bg-emerald-50/70 cursor-pointer'
                                                                : 'hover:bg-gray-50 cursor-pointer'
                                                        }`}
                                                        onClick={() => !isInvalid && toggleDryRunRow(item.id)}
                                                    >
                                                        {/* Checkbox */}
                                                        <td
                                                            className="px-3 py-3 text-center"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                disabled={isInvalid}
                                                                onChange={() => toggleDryRunRow(item.id)}
                                                                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                            />
                                                        </td>

                                                        {/* Nomor Baris */}
                                                        <td className="px-3 py-3 text-center font-mono text-gray-500">
                                                            #{item.row_number}
                                                        </td>

                                                        {/* NIS */}
                                                        <td className="px-4 py-3 font-mono font-bold text-gray-900">
                                                            <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                                                {item.nis}
                                                            </span>
                                                        </td>

                                                        {/* Nama Santri & Perbandingan jika Merger */}
                                                        <td className="px-4 py-3">
                                                            {item.action === 'update' && item.changes?.nama ? (
                                                                <div>
                                                                    <div className="text-[11px] text-gray-400 line-through">
                                                                        {item.changes.nama.old}
                                                                    </div>
                                                                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                                                                        <span>{item.changes.nama.new}</span>
                                                                        <span className="text-[9px] bg-blue-100 text-blue-800 font-semibold px-1 rounded">
                                                                            Update
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="font-semibold text-gray-800">
                                                                    {item.nama}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Kelas */}
                                                        <td className="px-4 py-3">
                                                            {item.action === 'update' && item.changes?.kelas ? (
                                                                <div>
                                                                    <div className="text-[11px] text-gray-400 line-through">
                                                                        {item.changes.kelas.old}
                                                                    </div>
                                                                    <div className="font-bold text-blue-900">
                                                                        {item.changes.kelas.new}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-700 font-medium">
                                                                    {item.kelas || '-'}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Status */}
                                                        <td className="px-3 py-3 text-center">
                                                            {item.action === 'update' && item.changes?.status ? (
                                                                <div className="text-center">
                                                                    <span className="text-[10px] text-gray-400 line-through block">
                                                                        {item.changes.status.old}
                                                                    </span>
                                                                    <span className="font-bold text-blue-800 text-[11px]">
                                                                        {item.changes.status.new}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span
                                                                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                                                        item.status === 'Aktif'
                                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                            : 'bg-red-50 text-red-700 border border-red-200'
                                                                    }`}
                                                                >
                                                                    {item.status}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Badge Aksi Rekonsiliasi */}
                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                            {item.action === 'new' && (
                                                                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                    ✨ Siswa Baru
                                                                </span>
                                                            )}
                                                            {item.action === 'update' && (
                                                                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                                                                    🔄 Merger Data
                                                                </span>
                                                            )}
                                                            {item.action === 'same' && (
                                                                <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-600">
                                                                    ✔️ Identik
                                                                </span>
                                                            )}
                                                            {item.action === 'invalid' && (
                                                                <span
                                                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100 text-red-800 border border-red-200"
                                                                    title={item.error}
                                                                >
                                                                    ❌ {item.error}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 bg-gray-50/70 rounded-b-2xl">
                            <div className="text-xs text-gray-600 flex items-center gap-2">
                                <span>📌</span>
                                <span>
                                    Terpilih:{' '}
                                    <strong className="text-emerald-700 font-bold text-sm">
                                        {selectedDryRunCount}
                                    </strong>{' '}
                                    santri untuk diimport / dimerge ke database.
                                </span>
                            </div>

                            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={() => setDryRunData(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Batal / Tutup
                                </button>
                                <button
                                    type="button"
                                    onClick={handleApplyImport}
                                    disabled={selectedDryRunCount === 0 || isApplyingImport}
                                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className={isApplyingImport ? 'animate-spin' : ''}>⚡</span>
                                    {isApplyingImport
                                        ? 'Menerapkan...'
                                        : `Terapkan Import & Merger (${selectedDryRunCount})`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL POPUP TAMBAH SISWA MANUAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-gray-900">Tambah Santri Baru</h3>
                            <button onClick={closeAddModal} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitAddForm} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">
                                    Nomor Induk Siswa (NIS)
                                </label>
                                <input
                                    type="text"
                                    value={data.nis}
                                    onChange={(e) => setData('nis', e.target.value)}
                                    placeholder="Contoh: 2026001"
                                    className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                                    required
                                />
                                {errors.nis && <div className="mt-1 text-red-500">{errors.nis}</div>}
                            </div>

                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">
                                    Nama Lengkap Santri
                                </label>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    placeholder="Masukkan nama lengkap santri..."
                                    className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                                    required
                                />
                                {errors.nama && <div className="mt-1 text-red-500">{errors.nama}</div>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Kelas</label>
                                    <input
                                        type="text"
                                        value={data.kelas}
                                        onChange={(e) => setData('kelas', e.target.value)}
                                        placeholder="Contoh: VII-A"
                                        className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-emerald-500"
                                        required
                                    />
                                    {errors.kelas && <div className="mt-1 text-red-500">{errors.kelas}</div>}
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Status</label>
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
                                    onClick={closeAddModal}
                                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-xs font-bold text-white transition rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Santri'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL POPUP EDIT SISWA */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                    <div className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-gray-900">Edit Data Santri</h3>
                            <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitEditForm} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">
                                    Nomor Induk Siswa (NIS)
                                </label>
                                <input
                                    type="text"
                                    value={data.nis}
                                    onChange={(e) => setData('nis', e.target.value)}
                                    className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                                {errors.nis && <div className="mt-1 text-red-500">{errors.nis}</div>}
                            </div>

                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">
                                    Nama Lengkap Santri
                                </label>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                                {errors.nama && <div className="mt-1 text-red-500">{errors.nama}</div>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Kelas</label>
                                    <input
                                        type="text"
                                        value={data.kelas}
                                        onChange={(e) => setData('kelas', e.target.value)}
                                        className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                    {errors.kelas && <div className="mt-1 text-red-500">{errors.kelas}</div>}
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">Status</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="w-full text-xs py-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Non-Aktif">Non-Aktif</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end pt-3 mt-4 space-x-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-xs font-bold text-white transition bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
                                >
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
