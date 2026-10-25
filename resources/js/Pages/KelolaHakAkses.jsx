import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';

export default function KelolaHakAkses({ auth, features, matrix: initialMatrix, roles }) {
    const [matrix, setMatrix] = useState(initialMatrix);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const setPermissionLevel = (role, featureKey, level) => {
        // Jangan izinkan Admin mematikan kelola_hak_akses untuk Admin sendiri (mencegah lockout)
        if (role === 'Admin' && featureKey === 'kelola_hak_akses' && level !== 'manage') {
            return;
        }

        setMatrix((prev) => ({
            ...prev,
            [role]: {
                ...prev[role],
                [featureKey]: level,
            },
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        router.post(
            route('kelola.hak-akses.update'),
            { matrix },
            {
                onSuccess: () => {
                    setSaving(false);
                    setMessage(
                        'Matriks hak akses bertingkat berhasil diperbarui dan diterapkan ke seluruh pengguna!'
                    );
                    setTimeout(() => setMessage(''), 5000);
                },
                onError: () => {
                    setSaving(false);
                    alert('Gagal memperbarui hak akses. Silakan periksa kembali isian Anda.');
                },
            }
        );
    };

    const handleReset = () => {
        if (
            !confirm(
                'Apakah Anda yakin ingin mengembalikan seluruh hak akses ke konfigurasi default sistem?'
            )
        ) {
            return;
        }

        router.post(
            route('kelola.hak-akses.reset'),
            {},
            {
                onSuccess: () => {
                    setMessage('Hak akses berhasil dikembalikan ke standar awal sistem!');
                    setTimeout(() => setMessage(''), 4000);
                },
            }
        );
    };

    // Kelompokkan fitur berdasarkan kategori
    const categories = ['Utama', 'Operasional', 'Laporan', 'Data Master', 'Administrasi'];

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Ustadz':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Siswa':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <AuthenticatedLayout user={auth.user} header="Matriks Hak Akses Dinamis (RBAC)">
            <Head title="Pengaturan Hak Akses" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Banner Info */}
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl shadow-lg p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">🛡️</span>
                            <h2 className="text-xl font-bold">Role-Based Access Control (RBAC) Granular</h2>
                            <span className="bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-semibold backdrop-blur-sm">
                                Bertingkat
                            </span>
                        </div>
                        <p className="text-emerald-50 text-xs md:text-sm max-w-2xl">
                            Atur izin akses fitur secara spesifik untuk setiap peran:{' '}
                            <strong className="text-white">Dilarang (None)</strong>,{' '}
                            <strong className="text-white">Hanya Lihat (View Only)</strong>, atau{' '}
                            <strong className="text-white">Bisa Kelola (Edit & Delete)</strong>. Perubahan langsung aktif
                            pada tampilan tombol aksi dan keamanan backend.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 self-end md:self-center">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-medium text-white transition flex items-center gap-2"
                        >
                            <span>↺</span> Reset ke Default
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs md:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <svg
                                        className="animate-spin h-4 w-4 text-emerald-800"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8H4z"
                                        ></path>
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <span>💾</span> Simpan Perubahan
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Legend Panduan Tingkat Hak Akses */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-xs flex items-start gap-3">
                        <span className="p-2 bg-red-50 rounded-xl text-lg">🚫</span>
                        <div>
                            <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider">
                                1. Dilarang (None)
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Pengguna tidak memiliki izin membuka fitur. Menu di sidebar disembunyikan dan route diblokir (403 Forbidden).
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex items-start gap-3">
                        <span className="p-2 bg-amber-50 rounded-xl text-lg">👁️</span>
                        <div>
                            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                                2. Hanya Lihat (View Only)
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Pengguna bisa melihat data tabel, memfilter, mencari, dan mengunduh laporan/CSV. Tombol Tambah, Edit, Hapus, dan Upload disembunyikan.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-start gap-3">
                        <span className="p-2 bg-emerald-50 rounded-xl text-lg">✏️</span>
                        <div>
                            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                3. Bisa Kelola (Edit & Delete)
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Akses penuh: pengguna dapat melihat, menambah data baru, mengedit, menghapus, dan melakukan upload massal dokumen.
                            </p>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm shadow-sm animate-fade-in">
                        <span>✅</span>
                        <span>{message}</span>
                    </div>
                )}

                {/* Tabel Matriks Hak Akses Bertingkat */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="py-4 px-6 min-w-[280px]">Fitur & Hak Akses</th>
                                    <th className="py-4 px-4 min-w-[130px]">Kategori</th>
                                    {roles.map((role) => (
                                        <th key={role} className="py-4 px-6 text-center min-w-[280px]">
                                            <span
                                                className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${getRoleBadge(
                                                    role
                                                )}`}
                                            >
                                                {role === 'Siswa' ? 'Siswa / Santri' : role}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {categories.map((cat) => {
                                    const catFeatures = Object.entries(features).filter(
                                        ([_, f]) => f.category === cat
                                    );
                                    if (catFeatures.length === 0) return null;

                                    return (
                                        <React.Fragment key={cat}>
                                            <tr className="bg-gray-50/60 font-semibold text-xs text-gray-400 uppercase tracking-wider">
                                                <td colSpan={2 + roles.length} className="py-2.5 px-6">
                                                    Kategori: {cat}
                                                </td>
                                            </tr>
                                            {catFeatures.map(([featureKey, feat]) => (
                                                <tr
                                                    key={featureKey}
                                                    className="hover:bg-emerald-50/30 transition-colors"
                                                >
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-start gap-3">
                                                            <span className="text-xl p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                                                {feat.icon || '📌'}
                                                            </span>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">
                                                                    {feat.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                    {feat.description}
                                                                </p>
                                                                {featureKey === 'rekap_setoran' ||
                                                                featureKey === 'rekap_siswa' ? (
                                                                    <span className="inline-block mt-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                                        *Siswa hanya melihat data miliknya sendiri
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-xs text-gray-500">
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                                                            {feat.category}
                                                        </span>
                                                    </td>
                                                    {roles.map((role) => {
                                                        const rawVal = matrix[role]?.[featureKey];
                                                        const currentLevel =
                                                            rawVal === true
                                                                ? 'manage'
                                                                : rawVal === false
                                                                ? 'none'
                                                                : rawVal || 'none';

                                                        const isLockedAdmin =
                                                            role === 'Admin' &&
                                                            featureKey === 'kelola_hak_akses';

                                                        return (
                                                            <td key={role} className="py-4 px-4 text-center">
                                                                <div className="inline-flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200 shadow-2xs">
                                                                    {/* 1. Opsi DILARANG */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={isLockedAdmin}
                                                                        onClick={() =>
                                                                            setPermissionLevel(
                                                                                role,
                                                                                featureKey,
                                                                                'none'
                                                                            )
                                                                        }
                                                                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                                                                            currentLevel === 'none'
                                                                                ? 'bg-red-500 text-white shadow-xs'
                                                                                : 'text-gray-500 hover:text-red-700'
                                                                        } ${
                                                                            isLockedAdmin
                                                                                ? 'opacity-40 cursor-not-allowed'
                                                                                : ''
                                                                        }`}
                                                                        title="Dilarang: Tidak dapat mengakses fitur ini"
                                                                    >
                                                                        <span>🚫</span>
                                                                        <span className="text-[11px]">Dilarang</span>
                                                                    </button>

                                                                    {/* 2. Opsi HANYA LIHAT */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={isLockedAdmin}
                                                                        onClick={() =>
                                                                            setPermissionLevel(
                                                                                role,
                                                                                featureKey,
                                                                                'view'
                                                                            )
                                                                        }
                                                                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                                                                            currentLevel === 'view'
                                                                                ? 'bg-amber-500 text-white shadow-xs'
                                                                                : 'text-gray-500 hover:text-amber-700'
                                                                        } ${
                                                                            isLockedAdmin
                                                                                ? 'opacity-40 cursor-not-allowed'
                                                                                : ''
                                                                        }`}
                                                                        title="Hanya Lihat (View Only): Bisa melihat tabel, tidak bisa tambah/edit/hapus"
                                                                    >
                                                                        <span>👁️</span>
                                                                        <span className="text-[11px]">Lihat</span>
                                                                    </button>

                                                                    {/* 3. Opsi BISA KELOLA (EDIT & DELETE) */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={isLockedAdmin}
                                                                        onClick={() =>
                                                                            setPermissionLevel(
                                                                                role,
                                                                                featureKey,
                                                                                'manage'
                                                                            )
                                                                        }
                                                                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                                                                            currentLevel === 'manage'
                                                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                                                : 'text-gray-500 hover:text-emerald-700'
                                                                        } ${
                                                                            isLockedAdmin
                                                                                ? 'cursor-not-allowed'
                                                                                : ''
                                                                        }`}
                                                                        title={
                                                                            isLockedAdmin
                                                                                ? 'Hak Super Admin untuk Kelola Hak Akses selalu aktif'
                                                                                : 'Bisa Kelola: Akses penuh untuk Tambah, Edit, dan Hapus data'
                                                                        }
                                                                    >
                                                                        <span>{isLockedAdmin ? '🔒' : '✏️'}</span>
                                                                        <span className="text-[11px]">Edit/Hapus</span>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Tindakan */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            💡 Klik pilihan pada kolom peran yang diinginkan, lalu tekan <strong>"Simpan Hak Akses"</strong>.
                        </span>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-semibold shadow transition disabled:opacity-50"
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Hak Akses'}
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
