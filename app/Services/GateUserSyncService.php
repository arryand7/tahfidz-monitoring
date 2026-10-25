<?php

namespace App\Services;

use App\Models\Siswa;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class GateUserSyncService
{
    protected GateProvisioningClient $client;

    public function __construct(GateProvisioningClient $client)
    {
        $this->client = $client;
    }

    /**
     * Pemetaan tipe dari Gate SSO ke peran (role) di Sabira Tahfidz.
     * Aturan dari User:
     * - student/siswa/santri => 'Siswa'
     * - admin/superadmin     => 'Admin'
     * - selain itu           => 'Ustadz' (teacher / pendidik)
     */
    public function mapRole(?string $gateType): string
    {
        $type = strtolower(trim($gateType ?? ''));

        if (in_array($type, ['student', 'siswa', 'santri'], true)) {
            return 'Siswa';
        }

        if (in_array($type, ['admin', 'superadmin'], true)) {
            return 'Admin';
        }

        // Selain student dan admin, dimasukkan menjadi teacher (Ustadz)
        return 'Ustadz';
    }

    /**
     * Pemetaan status Gate SSO ('active', 'suspended', dll) ke Sabira Tahfidz ('Aktif', 'Non-Aktif')
     */
    public function mapStatus(?string $gateStatus): string
    {
        $status = strtolower(trim($gateStatus ?? ''));

        return ($status === 'active' || $status === 'aktif') ? 'Aktif' : 'Non-Aktif';
    }

    /**
     * Jalankan rekonsiliasi Dry-Run tanpa mengubah data database sama sekali.
     * Mengembalikan daftar user lengkap beserta status perbandingannya (Baru, Update, Matched).
     */
    public function dryRun(): array
    {
        $fetchResult = $this->client->fetchCanonicalUsers();
        $gateUsers = $fetchResult['users'];
        $localUsers = User::all();

        // Index local users untuk pencarian cepat
        $localByGateUuid = $localUsers->whereNotNull('gate_user_uuid')->keyBy('gate_user_uuid');
        $localByUsername = $localUsers->whereNotNull('username')->keyBy('username');
        $localByEmail = $localUsers->whereNotNull('email')->keyBy('email');

        $reconciledItems = [];
        $counts = [
            'total' => count($gateUsers),
            'new' => 0,
            'update' => 0,
            'matched' => 0,
        ];

        foreach ($gateUsers as $gu) {
            $uuid = $gu['uuid'] ?? $gu['gate_user_uuid'] ?? null;
            $username = $gu['username'] ?? $gu['nis'] ?? $gu['nip'] ?? null;
            $name = $gu['name'] ?? 'User Tanpa Nama';
            $email = $gu['email'] ?? ($username ? "{$username}@sabira.local" : null);
            $gateType = $gu['type'] ?? $gu['user_type'] ?? 'student';
            $mappedRole = $this->mapRole($gateType);
            $mappedStatus = $this->mapStatus($gu['status'] ?? 'active');
            $nis = $gu['nis'] ?? null;
            $nip = $gu['nip'] ?? null;

            // Cari user lokal yang cocok
            $localUser = null;
            if ($uuid && isset($localByGateUuid[$uuid])) {
                $localUser = $localByGateUuid[$uuid];
            } elseif ($username && isset($localByUsername[$username])) {
                $localUser = $localByUsername[$username];
            } elseif ($email && isset($localByEmail[$email])) {
                $localUser = $localByEmail[$email];
            }

            if (! $localUser) {
                // User belum ada sama sekali di Sabira Tahfidz
                $counts['new']++;
                $reconciledItems[] = [
                    'uuid' => $uuid,
                    'name' => $name,
                    'username' => $username,
                    'email' => $email,
                    'gate_type' => $gateType,
                    'mapped_role' => $mappedRole,
                    'mapped_status' => $mappedStatus,
                    'nis' => $nis,
                    'nip' => $nip,
                    'reconcile_status' => 'new', // Baru
                    'differences' => [],
                    'local_user_id' => null,
                    'selected' => true, // default checked
                ];
            } else {
                // User sudah ada di Sabira Tahfidz, periksa perbedaan atribut
                $diffs = [];

                if ($localUser->name !== $name) {
                    $diffs['name'] = ['local' => $localUser->name, 'gate' => $name];
                }
                if ($username && $localUser->username !== $username) {
                    $diffs['username'] = ['local' => $localUser->username, 'gate' => $username];
                }
                if ($email && $localUser->email !== $email) {
                    $diffs['email'] = ['local' => $localUser->email, 'gate' => $email];
                }
                if ($localUser->role !== $mappedRole) {
                    $diffs['role'] = ['local' => $localUser->role, 'gate' => $mappedRole];
                }
                if ($localUser->status !== $mappedStatus) {
                    $diffs['status'] = ['local' => $localUser->status, 'gate' => $mappedStatus];
                }
                if (empty($localUser->gate_user_uuid) && $uuid) {
                    $diffs['gate_user_uuid'] = ['local' => null, 'gate' => $uuid];
                }

                if (! empty($diffs)) {
                    $counts['update']++;
                    $reconciledItems[] = [
                        'uuid' => $uuid,
                        'name' => $name,
                        'username' => $username,
                        'email' => $email,
                        'gate_type' => $gateType,
                        'mapped_role' => $mappedRole,
                        'mapped_status' => $mappedStatus,
                        'nis' => $nis,
                        'nip' => $nip,
                        'reconcile_status' => 'update', // Perlu Update
                        'differences' => $diffs,
                        'local_user_id' => $localUser->id,
                        'selected' => true, // default checked
                    ];
                } else {
                    $counts['matched']++;
                    $reconciledItems[] = [
                        'uuid' => $uuid,
                        'name' => $name,
                        'username' => $username,
                        'email' => $email,
                        'gate_type' => $gateType,
                        'mapped_role' => $mappedRole,
                        'mapped_status' => $mappedStatus,
                        'nis' => $nis,
                        'nip' => $nip,
                        'reconcile_status' => 'matched', // Sudah Sinkron
                        'differences' => [],
                        'local_user_id' => $localUser->id,
                        'selected' => false, // default unchecked karena sudah sinkron
                    ];
                }
            }
        }

        return [
            'source' => $fetchResult['source'],
            'origin' => $fetchResult['origin'],
            'summary' => $counts,
            'items' => $reconciledItems,
        ];
    }

    /**
     * Terapkan sinkronisasi untuk user-user yang dipilih / dicentang oleh pengguna.
     *
     * @param  array  $selectedUuids  Daftar UUID user Gate SSO yang dipilih
     * @return array Ringkasan hasil sinkronisasi
     */
    public function applySync(array $selectedUuids): array
    {
        if (empty($selectedUuids)) {
            return [
                'success' => false,
                'message' => 'Tidak ada pengguna yang dipilih untuk disinkronkan.',
                'synced_count' => 0,
            ];
        }

        $dryRunData = $this->dryRun();
        $itemsByUuid = collect($dryRunData['items'])->keyBy('uuid');

        $createdCount = 0;
        $updatedCount = 0;
        $studentCount = 0;
        $ustadzCount = 0;
        $adminCount = 0;
        $syncResultItems = [];

        DB::transaction(function () use (
            $selectedUuids,
            $itemsByUuid,
            &$createdCount,
            &$updatedCount,
            &$studentCount,
            &$ustadzCount,
            &$adminCount,
            &$syncResultItems
        ) {
            foreach ($selectedUuids as $uuid) {
                $item = $itemsByUuid->get($uuid);
                if (! $item) {
                    continue;
                }

                $username = $item['username'] ?: ($item['nis'] ?: $item['nip']);
                $name = $item['name'];
                $email = $item['email'] ?: ($username.'@sabira.local');
                $role = $item['mapped_role'];
                $status = $item['mapped_status'];

                // 1. Temukan atau buat User di tabel users
                $user = null;
                if (! empty($uuid)) {
                    $user = User::where('gate_user_uuid', $uuid)->first();
                }
                if (! $user && ! empty($username)) {
                    $user = User::where('username', $username)->first();
                }
                if (! $user && ! empty($email)) {
                    $user = User::where('email', $email)->first();
                }

                if ($user) {
                    // Update user yang sudah ada
                    $user->update([
                        'name' => $name,
                        'username' => $username,
                        'email' => $email,
                        'role' => $role,
                        'status' => $status,
                        'gate_user_uuid' => $uuid,
                    ]);
                    $updatedCount++;
                } else {
                    // Buat user baru dengan default password 'sabira123'
                    $user = User::create([
                        'name' => $name,
                        'username' => $username,
                        'email' => $email,
                        'role' => $role,
                        'status' => $status,
                        'gate_user_uuid' => $uuid,
                        'password' => Hash::make('sabira123'),
                    ]);
                    $createdCount++;
                }

                // Hitung statistik berdasarkan role
                if ($role === 'Siswa') {
                    $studentCount++;
                    // Sinkronkan ke tabel siswas
                    $nis = $item['nis'] ?: $username;
                    if ($nis) {
                        $existingSiswa = Siswa::where('nis', $nis)->first();
                        Siswa::updateOrCreate(
                            ['nis' => $nis],
                            [
                                'nama' => $name,
                                'kelas' => $existingSiswa ? $existingSiswa->kelas : 'Umum',
                                'status' => $status,
                            ]
                        );
                    }
                } elseif ($role === 'Ustadz') {
                    $ustadzCount++;
                    // Sinkronkan ke tabel ustadzs
                    $nip = $item['nip'] ?: $username;
                    if ($nip) {
                        Ustadz::updateOrCreate(
                            ['nip' => $nip],
                            [
                                'nama' => $name,
                                'status' => $status,
                            ]
                        );
                    }
                } elseif ($role === 'Admin') {
                    $adminCount++;
                }

                $syncResultItems[] = [
                    'gate_user_uuid' => $uuid,
                    'status' => 'matched',
                    'external_user_id' => (string) $user->id,
                ];
            }
        });

        // Laporkan balik ke Gate SSO jika terkoneksi API
        if (! empty($syncResultItems)) {
            $this->client->sendSyncResults($syncResultItems);
        }

        $totalSynced = $createdCount + $updatedCount;

        return [
            'success' => true,
            'message' => "Berhasil menyinkronkan {$totalSynced} pengguna ({$createdCount} akun baru, {$updatedCount} akun diperbarui).",
            'total_synced' => $totalSynced,
            'created_count' => $createdCount,
            'updated_count' => $updatedCount,
            'student_count' => $studentCount,
            'ustadz_count' => $ustadzCount,
            'admin_count' => $adminCount,
        ];
    }
}
