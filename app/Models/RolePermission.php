<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'role',
        'feature',
        'is_allowed',
        'access_level', // 'none', 'view', 'manage'
    ];

    protected function casts(): array
    {
        return [
            'is_allowed' => 'boolean',
        ];
    }

    /**
     * Definisi seluruh fitur yang dapat diatur hak aksesnya.
     */
    public static function features(): array
    {
        return [
            'dashboard' => [
                'name' => 'Dashboard Utama',
                'description' => 'Melihat ringkasan statistik harian dan aktivitas terkini',
                'category' => 'Utama',
                'icon' => '📊',
                'allow_view_only' => true,
            ],
            'input_setoran' => [
                'name' => 'Input Setoran Baru',
                'description' => 'Mencatat hafalan atau murojaah baru santri',
                'category' => 'Operasional',
                'icon' => '✍️',
                'allow_view_only' => false, // Hanya dilarang atau kelola (input)
            ],
            'rekap_setoran' => [
                'name' => 'Rekap Setoran Global',
                'description' => 'Melihat dan mengunduh tabel riwayat setoran hafalan santri',
                'category' => 'Laporan',
                'icon' => '📁',
                'allow_view_only' => true,
            ],
            'rekap_siswa' => [
                'name' => 'Rekap Data Santri & Ekspor',
                'description' => 'Melihat rekap akumulasi hafalan, export PDF raport & CSV',
                'category' => 'Laporan',
                'icon' => '🎓',
                'allow_view_only' => true,
            ],
            'master_siswa' => [
                'name' => 'Database Santri (Master)',
                'description' => 'Lihat data santri (View) atau kelola tambah, edit, hapus, upload (Manage)',
                'category' => 'Data Master',
                'icon' => '🗂️',
                'allow_view_only' => true,
            ],
            'master_ustadz' => [
                'name' => 'Database Ustadz (Master)',
                'description' => 'Lihat data guru/ustadz (View) atau kelola tambah, edit, hapus, upload (Manage)',
                'category' => 'Data Master',
                'icon' => '👨‍🏫',
                'allow_view_only' => true,
            ],
            'master_quran' => [
                'name' => 'Master Al-Qur\'an',
                'description' => 'Melihat katalog 114 surah, ayat, dan juz Al-Qur\'an',
                'category' => 'Data Master',
                'icon' => '📖',
                'allow_view_only' => true,
            ],
            'kelola_user' => [
                'name' => 'Kelola Pengguna',
                'description' => 'Lihat akun (View) atau kelola buat akun, edit, hapus, & generate massal (Manage)',
                'category' => 'Administrasi',
                'icon' => '⚙️',
                'allow_view_only' => true,
            ],
            'sync_sso' => [
                'name' => 'Sinkronisasi Gate SSO',
                'description' => 'Lihat setting SSO (View) atau tes koneksi, ubah setting & apply sync (Manage)',
                'category' => 'Administrasi',
                'icon' => '🔄',
                'allow_view_only' => true,
            ],
            'kelola_hak_akses' => [
                'name' => 'Pengaturan Hak Akses (RBAC)',
                'description' => 'Lihat matriks (View) atau ubah dan simpan hak akses per tipe user (Manage)',
                'category' => 'Administrasi',
                'icon' => '🛡️',
                'allow_view_only' => true,
            ],
        ];
    }

    /**
     * Nilai default hak akses bertingkat untuk masing-masing peran.
     * Tingkat: 'none' (Dilarang), 'view' (Hanya Lihat), 'manage' (Bisa Edit / Delete / Kelola Penuh)
     */
    public static function defaultMatrix(): array
    {
        return [
            'Admin' => [
                'dashboard' => 'manage',
                'input_setoran' => 'manage',
                'rekap_setoran' => 'manage',
                'rekap_siswa' => 'manage',
                'master_siswa' => 'manage',
                'master_ustadz' => 'manage',
                'master_quran' => 'manage',
                'kelola_user' => 'manage',
                'sync_sso' => 'manage',
                'kelola_hak_akses' => 'manage',
            ],
            'Ustadz' => [
                'dashboard' => 'view',
                'input_setoran' => 'manage',
                'rekap_setoran' => 'view',
                'rekap_siswa' => 'view',
                'master_siswa' => 'none',
                'master_ustadz' => 'none',
                'master_quran' => 'view',
                'kelola_user' => 'none',
                'sync_sso' => 'none',
                'kelola_hak_akses' => 'none',
            ],
            'Siswa' => [
                'dashboard' => 'view',
                'input_setoran' => 'none',
                'rekap_setoran' => 'view',
                'rekap_siswa' => 'view',
                'master_siswa' => 'none',
                'master_ustadz' => 'none',
                'master_quran' => 'view',
                'kelola_user' => 'none',
                'sync_sso' => 'none',
                'kelola_hak_akses' => 'none',
            ],
        ];
    }

    /**
     * Dapatkan matriks seluruh hak akses saat ini (dari database digabung default).
     * Format: ['Role' => ['feature' => 'none'|'view'|'manage']]
     */
    public static function getMatrix(): array
    {
        $defaults = static::defaultMatrix();
        $stored = static::all();

        $matrix = $defaults;
        foreach ($stored as $item) {
            if (isset($matrix[$item->role]) && array_key_exists($item->feature, $matrix[$item->role])) {
                if ($item->access_level) {
                    $matrix[$item->role][$item->feature] = $item->access_level;
                } else {
                    $matrix[$item->role][$item->feature] = $item->is_allowed ? 'manage' : 'none';
                }
            }
        }

        return $matrix;
    }

    /**
     * Dapatkan seluruh hak akses untuk satu peran tertentu.
     * Mengembalikan array asosiatif: ['feature' => 'none'|'view'|'manage']
     */
    public static function getPermissionsForRole(?string $role): array
    {
        if (! $role) {
            return [];
        }

        $matrix = static::getMatrix();

        return $matrix[$role] ?? [];
    }

    /**
     * Cek apakah sebuah peran memenuhi tingkat akses fitur yang diminta.
     *
     * @param  string  $requiredLevel  'view' (boleh view atau manage) atau 'manage' (wajib manage/edit/delete)
     */
    public static function isAllowed(?string $role, string $feature, string $requiredLevel = 'view'): bool
    {
        if (! $role) {
            return false;
        }

        // Admin selalu 'manage' untuk kelola_hak_akses agar tidak terkunci
        if ($role === 'Admin' && $feature === 'kelola_hak_akses') {
            return true;
        }

        $permissions = static::getPermissionsForRole($role);
        $level = $permissions[$feature] ?? 'none';

        if ($level === 'none') {
            return false;
        }

        if ($requiredLevel === 'view') {
            return $level === 'view' || $level === 'manage';
        }

        if ($requiredLevel === 'manage') {
            return $level === 'manage';
        }

        return false;
    }

    /**
     * Helper cek apakah role memiliki akses kelola (tambah, edit, delete).
     */
    public static function canManage(?string $role, string $feature): bool
    {
        return static::isAllowed($role, $feature, 'manage');
    }

    /**
     * Helper cek apakah role memiliki akses lihat (minimal view).
     */
    public static function canView(?string $role, string $feature): bool
    {
        return static::isAllowed($role, $feature, 'view');
    }

    /**
     * Simpan matriks pembaruan hak akses.
     */
    public static function updateMatrix(array $newMatrix): void
    {
        foreach ($newMatrix as $role => $features) {
            if (! in_array($role, ['Admin', 'Ustadz', 'Siswa'], true)) {
                continue;
            }

            foreach ($features as $feature => $level) {
                // Konversi jika boolean lama terkirim
                if (is_bool($level)) {
                    $level = $level ? 'manage' : 'none';
                }

                if (! in_array($level, ['none', 'view', 'manage'], true)) {
                    $level = 'none';
                }

                // Jangan turunkan hak akses Admin untuk kelola_hak_akses
                if ($role === 'Admin' && $feature === 'kelola_hak_akses') {
                    $level = 'manage';
                }

                $isAllowed = $level !== 'none';

                static::updateOrCreate(
                    ['role' => $role, 'feature' => $feature],
                    [
                        'access_level' => $level,
                        'is_allowed' => $isAllowed,
                    ]
                );
            }
        }
    }

    /**
     * Kembalikan seluruh hak akses ke nilai awal (reset to default).
     */
    public static function resetToDefault(): void
    {
        static::truncate();
    }
}
