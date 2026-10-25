import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import axios from 'axios';

export default function SyncSso({ auth, ssoConfig, initialDryRun, initialError }) {
    const { flash } = usePage().props;

    const [dryRunData, setDryRunData] = useState(initialDryRun);
    const [isLoadingDryRun, setIsLoadingDryRun] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [errorMessage, setErrorMessage] = useState(initialError);

    // Filter & Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Selection state: Map of UUID -> boolean
    const [selectedUuids, setSelectedUuids] = useState(() => {
        const initial = {};
        if (initialDryRun && initialDryRun.items) {
            initialDryRun.items.forEach(item => {
                // Default: centang yang baru dan perlu update
                if (item.reconcile_status === 'new' || item.reconcile_status === 'update') {
                    initial[item.uuid] = true;
                }
            });
        }
        return initial;
    });

    // Jalankan ulang Dry Run via AJAX
    const refreshDryRun = async () => {
        setIsLoadingDryRun(true);
        setErrorMessage(null);
        try {
            const response = await axios.post(route('sync.sso.dry-run'));
            if (response.data && response.data.success) {
                const data = response.data.data;
                setDryRunData(data);

                // Reset selection to default (new + update)
                const newSelected = {};
                data.items.forEach(item => {
                    if (item.reconcile_status === 'new' || item.reconcile_status === 'update') {
                        newSelected[item.uuid] = true;
                    }
                });
                setSelectedUuids(newSelected);
            } else {
                setErrorMessage(response.data.message || 'Gagal menjalankan dry-run.');
            }
        } catch (err) {
            setErrorMessage(err.response?.data?.message || err.message || 'Terjadi kesalahan saat memanggil Gate SSO.');
        } finally {
            setIsLoadingDryRun(false);
        }
    };

    // Filter items
    const filteredItems = useMemo(() => {
        if (!dryRunData || !dryRunData.items) return [];

        return dryRunData.items.filter(item => {
            const query = searchQuery.toLowerCase();
            const matchSearch =
                (item.name && item.name.toLowerCase().includes(query)) ||
                (item.username && item.username.toLowerCase().includes(query)) ||
                (item.email && item.email.toLowerCase().includes(query)) ||
                (item.nis && item.nis.toLowerCase().includes(query)) ||
                (item.nip && item.nip.toLowerCase().includes(query));

            const matchRole = roleFilter === '' || item.mapped_role === roleFilter;
            const matchStatus = statusFilter === '' || item.reconcile_status === statusFilter;

            return matchSearch && matchRole && matchStatus;
        });
    }, [dryRunData, searchQuery, roleFilter, statusFilter]);

    // Handle single checkbox toggle
    const toggleItem = (uuid) => {
        setSelectedUuids(prev => ({
            ...prev,
            [uuid]: !prev[uuid]
        }));
    };

    // Handle Select All visible
    const selectAllVisible = () => {
        setSelectedUuids(prev => {
            const next = { ...prev };
            filteredItems.forEach(item => {
                next[item.uuid] = true;
            });
            return next;
        });
    };

    // Handle Select Only New & Update
    const selectOnlyNewAndUpdate = () => {
        setSelectedUuids(prev => {
            const next = { ...prev };
            filteredItems.forEach(item => {
                next[item.uuid] = item.reconcile_status === 'new' || item.reconcile_status === 'update';
            });
            return next;
        });
    };

    // Handle Deselect All
    const deselectAll = () => {
        setSelectedUuids(prev => {
            const next = { ...prev };
            filteredItems.forEach(item => {
                next[item.uuid] = false;
            });
            return next;
        });
    };

    // Selected count
    const selectedCount = useMemo(() => {
        return Object.values(selectedUuids).filter(Boolean).length;
    }, [selectedUuids]);

    // Apply Sync
    const handleApplySync = () => {
        const uuidsToSync = Object.entries(selectedUuids)
            .filter(([_, isSelected]) => isSelected)
            .map(([uuid]) => uuid);

        if (uuidsToSync.length === 0) {
            alert('Silakan centang setidaknya satu pengguna untuk disinkronkan.');
            return;
        }

        const confirmMsg = `Apakah Anda yakin ingin menerapkan sinkronisasi untuk ${uuidsToSync.length} pengguna terpilih?\n\n- Siswa akan otomatis masuk ke tabel Siswa & User.\n- Ustadz/Guru/Staff akan masuk ke tabel Ustadz & User.\n- Password awal akun baru: "sabira123"`;

        if (!window.confirm(confirmMsg)) {
            return;
        }

        setIsApplying(true);
        router.post(route('sync.sso.apply'), {
            selected_uuids: uuidsToSync
        }, {
            preserveScroll: true,
            onFinish: () => {
                setIsApplying(false);
                refreshDryRun();
            }
        });
    };

    const isAllFilteredSelected = filteredItems.length > 0 && filteredItems.every(item => selectedUuids[item.uuid]);

    return (
        <AuthenticatedLayout user={auth.user} header="Sinkronisasi Pengguna Gate SSO">
            <Head title="Sinkronisasi Gate SSO" />

            <div className="space-y-6">
                {/* Flash Messages */}
                {flash?.message && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
                        flash.type === 'error'
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                        <span className="text-xl">{flash.type === 'error' ? '⚠️' : '✅'}</span>
                        <div className="flex-1">
                            <p className="font-semibold">{flash.message}</p>
                            {flash.result && (
                                <p className="mt-1 text-xs opacity-90">
                                    Detail: {flash.result.student_count} Siswa, {flash.result.ustadz_count} Ustadz, {flash.result.admin_count} Admin.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl text-amber-900">
                        <div className="flex items-center gap-2 font-semibold">
                            <span>⚠️</span>
                            <span>Peringatan Koneksi Gate SSO</span>
                        </div>
                        <p className="mt-1 text-sm">{errorMessage}</p>
                    </div>
                )}

                {/* Header Card: SSO Info & Rules Explanation */}
                <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-gray-900">Integrasi Gate SSO Sabira</h2>
                                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                                    dryRunData?.source === 'remote_api'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-purple-100 text-purple-800'
                                }`}>
                                    {dryRunData?.source === 'remote_api' ? '🌐 Remote API: gate.sabira-iibs.id' : '💻 Local Gate SSO SQLite'}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                Menyinkronkan direktori pengguna terpusat dari Gate SSO langsung ke sistem Sabira Tahfidz.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href={route('kelola.user')}
                                className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                ← Kelola User
                            </Link>

                            <button
                                onClick={refreshDryRun}
                                disabled={isLoadingDryRun}
                                className="flex items-center px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <span className={`mr-2 ${isLoadingDryRun ? 'animate-spin' : ''}`}>🔄</span>
                                {isLoadingDryRun ? 'Meninjau...' : 'Refresh Dry Run'}
                            </button>
                        </div>
                    </div>

                    {/* Rule Info Badges */}
                    <div className="grid grid-cols-1 gap-3 pt-4 mt-6 border-t border-gray-100 md:grid-cols-3 text-xs">
                        <div className="flex items-start gap-2 p-3 border rounded-xl bg-emerald-50/60 border-emerald-100">
                            <span className="text-base">🎓</span>
                            <div>
                                <span className="font-bold text-emerald-800">Student / Siswa / Santri</span>
                                <p className="text-emerald-700 mt-0.5">Masuk sebagai <b>Role Siswa</b> dan otomatis tersimpan di tabel Database Siswa (NIS).</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 border rounded-xl bg-purple-50/60 border-purple-100">
                            <span className="text-base">🛡️</span>
                            <div>
                                <span className="font-bold text-purple-800">Admin / Superadmin</span>
                                <p className="text-purple-700 mt-0.5">Masuk sebagai <b>Role Admin</b> dengan hak akses penuh ke seluruh menu aplikasi.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 border rounded-xl bg-blue-50/60 border-blue-100">
                            <span className="text-base">👨‍🏫</span>
                            <div>
                                <span className="font-bold text-blue-800">Teacher / Staff / Wali</span>
                                <p className="text-blue-700 mt-0.5">Masuk sebagai <b>Role Ustadz</b> (Teacher) dan otomatis tersimpan di Database Ustadz (NIP).</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dry Run Summary Cards */}
                {dryRunData && (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                            <div className="text-xs font-medium tracking-wider text-gray-400 uppercase">Total di Gate SSO</div>
                            <div className="mt-2 text-2xl font-black text-gray-900">{dryRunData.summary.total}</div>
                            <p className="mt-1 text-xs text-gray-500">Akun ditemukan di SSO</p>
                        </div>

                        <div className="p-5 border shadow-sm bg-emerald-50/70 border-emerald-100 rounded-xl">
                            <div className="text-xs font-medium tracking-wider uppercase text-emerald-600">Pengguna Baru</div>
                            <div className="mt-2 text-2xl font-black text-emerald-800">{dryRunData.summary.new}</div>
                            <p className="mt-1 text-xs text-emerald-600">Belum ada di sistem</p>
                        </div>

                        <div className="p-5 border shadow-sm bg-amber-50/70 border-amber-100 rounded-xl">
                            <div className="text-xs font-medium tracking-wider uppercase text-amber-600">Perlu Update</div>
                            <div className="mt-2 text-2xl font-black text-amber-800">{dryRunData.summary.update}</div>
                            <p className="mt-1 text-xs text-amber-600">Ada perbedaan data profil</p>
                        </div>

                        <div className="p-5 bg-white border border-gray-100 shadow-sm rounded-xl">
                            <div className="text-xs font-medium tracking-wider text-gray-400 uppercase">Sudah Sinkron</div>
                            <div className="mt-2 text-2xl font-black text-gray-700">{dryRunData.summary.matched}</div>
                            <p className="mt-1 text-xs text-gray-500">Data sudah identik</p>
                        </div>
                    </div>
                )}

                {/* Filter & Action Toolbar */}
                <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Pencarian */}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Cari Nama, Username, Email, NIS, NIP..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-lg shadow-sm pl-9 focus:border-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                        </div>

                        {/* Filter Role */}
                        <div className="w-full md:w-48">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="">Semua Role Target</option>
                                <option value="Siswa">Siswa</option>
                                <option value="Ustadz">Ustadz</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>

                        {/* Filter Status */}
                        <div className="w-full md:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="">Semua Status Dry-Run</option>
                                <option value="new">Hanya Pengguna Baru</option>
                                <option value="update">Hanya Perlu Update</option>
                                <option value="matched">Hanya Sudah Sinkron</option>
                            </select>
                        </div>
                    </div>

                    {/* Batch Selection Controls & Primary Button */}
                    <div className="flex flex-col items-start justify-between gap-4 pt-4 mt-4 border-t border-gray-100 sm:flex-row sm:items-center">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <button
                                onClick={isAllFilteredSelected ? deselectAll : selectAllVisible}
                                className="px-3 py-1.5 font-medium border rounded-md hover:bg-gray-50 text-gray-700 border-gray-300 transition-colors"
                            >
                                {isAllFilteredSelected ? 'Batalkan Semua' : 'Pilih Semua'}
                            </button>

                            <button
                                onClick={selectOnlyNewAndUpdate}
                                className="px-3 py-1.5 font-medium border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                            >
                                Pilih Baru & Update Saja
                            </button>

                            <button
                                onClick={deselectAll}
                                className="px-3 py-1.5 font-medium text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Kosongkan Centang
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <span className="text-xs font-semibold text-gray-600">
                                <span className="text-emerald-700 font-bold text-sm">{selectedCount}</span> pengguna dicentang
                            </span>

                            <button
                                onClick={handleApplySync}
                                disabled={selectedCount === 0 || isApplying}
                                className="flex items-center px-5 py-2 text-sm font-semibold text-white transition-all rounded-lg shadow-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <span className={`mr-2 ${isApplying ? 'animate-spin' : ''}`}>⚡</span>
                                {isApplying ? 'Menerapkan...' : `Terapkan Sinkronisasi (${selectedCount})`}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabel Hasil Dry Run */}
                <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase border-b border-gray-100 bg-gray-50">
                                <tr>
                                    <th className="w-12 px-4 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isAllFilteredSelected}
                                            onChange={isAllFilteredSelected ? deselectAll : selectAllVisible}
                                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-4">Pengguna (Gate SSO)</th>
                                    <th className="px-6 py-4 text-center">Tipe di Gate</th>
                                    <th className="px-6 py-4 text-center">Role di Sabira</th>
                                    <th className="px-6 py-4">Identitas (NIS / NIP)</th>
                                    <th className="px-6 py-4 text-center">Status Dry Run</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-gray-400">
                                            Tidak ada data pengguna yang sesuai dengan filter pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item) => {
                                        const isSelected = !!selectedUuids[item.uuid];

                                        return (
                                            <tr
                                                key={item.uuid}
                                                className={`transition-colors cursor-pointer ${
                                                    isSelected ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-gray-50'
                                                }`}
                                                onClick={() => toggleItem(item.uuid)}
                                            >
                                                <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleItem(item.uuid)}
                                                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                                                    />
                                                </td>

                                                {/* Info Pengguna */}
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{item.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        <span className="font-mono text-gray-600">{item.username || '-'}</span>
                                                        {item.email && <span className="ml-2">({item.email})</span>}
                                                    </div>
                                                </td>

                                                {/* Tipe Asli di Gate SSO */}
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 capitalize">
                                                        {item.gate_type}
                                                    </span>
                                                </td>

                                                {/* Role Target di Sabira Tahfidz */}
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                                        item.mapped_role === 'Admin'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : item.mapped_role === 'Ustadz'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                        {item.mapped_role}
                                                    </span>
                                                </td>

                                                {/* NIS / NIP */}
                                                <td className="px-6 py-4">
                                                    {item.nis && (
                                                        <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-medium">
                                                            NIS: {item.nis}
                                                        </span>
                                                    )}
                                                    {item.nip && (
                                                        <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono font-medium">
                                                            NIP: {item.nip}
                                                        </span>
                                                    )}
                                                    {!item.nis && !item.nip && (
                                                        <span className="text-xs text-gray-400 font-mono">-</span>
                                                    )}
                                                </td>

                                                {/* Status Rekonsiliasi (Dry Run) */}
                                                <td className="px-6 py-4 text-center">
                                                    {item.reconcile_status === 'new' && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                                            ✨ Pengguna Baru
                                                        </span>
                                                    )}
                                                    {item.reconcile_status === 'update' && (
                                                        <div className="inline-flex flex-col items-center">
                                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                                                ✏️ Perlu Update
                                                            </span>
                                                            {item.differences && Object.keys(item.differences).length > 0 && (
                                                                <span className="text-[10px] text-amber-700 mt-1">
                                                                    ({Object.keys(item.differences).join(', ')})
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {item.reconcile_status === 'matched' && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                            ✓ Sudah Sinkron
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
            </div>
        </AuthenticatedLayout>
    );
}
