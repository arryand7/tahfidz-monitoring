<?php

namespace App\Services;

use App\Models\Siswa;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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

        // Tingkatkan batas waktu eksekusi agar sinkronisasi massal (ratusan pengguna) tidak timeout
        if (function_exists('set_time_limit')) {
            @set_time_limit(300);
        }

        $dryRunData = $this->dryRun();
        $itemsByUuid = collect($dryRunData['items'])->keyBy('uuid');

        $createdCount = 0;
        $updatedCount = 0;
        $studentCount = 0;
        $ustadzCount = 0;
        $adminCount = 0;
        $syncResultItems = [];

        // Pre-compute hash password sekali di awal untuk performa kilat (mencegah timeout BcryptHasher)
        $defaultPasswordHash = Hash::make('sabira123');

        // Preload index data lokal untuk menghindari ribuan query N+1
        $localUsersByUuid = User::whereNotNull('gate_user_uuid')->get()->keyBy('gate_user_uuid');
        $localUsersByUsername = User::whereNotNull('username')->get()->keyBy('username');
        $localUsersByEmail = User::whereNotNull('email')->get()->keyBy('email');
        $existingSiswas = Siswa::all()->keyBy('nis');
        $existingUstadzs = Ustadz::whereNotNull('nip')->get()->keyBy('nip');

        DB::transaction(function () use (
            $selectedUuids,
            $itemsByUuid,
            $defaultPasswordHash,
            &$localUsersByUuid,
            &$localUsersByUsername,
            &$localUsersByEmail,
            &$existingSiswas,
            &$existingUstadzs,
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

                // 1. Temukan atau buat User di tabel users via in-memory lookup
                $user = null;
                if (! empty($uuid) && isset($localUsersByUuid[$uuid])) {
                    $user = $localUsersByUuid[$uuid];
                } elseif (! empty($username) && isset($localUsersByUsername[$username])) {
                    $user = $localUsersByUsername[$username];
                } elseif (! empty($email) && isset($localUsersByEmail[$email])) {
                    $user = $localUsersByEmail[$email];
                }

                if ($user) {
                    // Hindari error UNIQUE constraint jika email dipegang oleh akun lokal lama lain
                    if (! empty($email) && isset($localUsersByEmail[$email]) && $localUsersByEmail[$email]->id !== $user->id) {
                        $conflictEmailUser = $localUsersByEmail[$email];
                        $fallbackEmail = "{$conflictEmailUser->username}_{$conflictEmailUser->id}@sabira.local";
                        $conflictEmailUser->update(['email' => $fallbackEmail]);
                        $localUsersByEmail[$fallbackEmail] = $conflictEmailUser;
                        unset($localUsersByEmail[$email]);
                    }

                    // Hindari error UNIQUE constraint jika username dipegang oleh akun lokal lama lain
                    if (! empty($username) && isset($localUsersByUsername[$username]) && $localUsersByUsername[$username]->id !== $user->id) {
                        $conflictUsernameUser = $localUsersByUsername[$username];
                        $fallbackUsername = "{$conflictUsernameUser->username}_{$conflictUsernameUser->id}";
                        $conflictUsernameUser->update(['username' => $fallbackUsername]);
                        $localUsersByUsername[$fallbackUsername] = $conflictUsernameUser;
                        unset($localUsersByUsername[$username]);
                    }

                    // Update user yang sudah ada
                    $user->update([
                        'name' => $name,
                        'username' => $username,
                        'email' => $email,
                        'role' => $role,
                        'status' => $status,
                        'gate_user_uuid' => $uuid,
                        'sso_synced_at' => now(),
                    ]);
                    $updatedCount++;
                } else {
                    // Cek jika ada user lain yang kebetulan memegang email atau username
                    if (! empty($email) && isset($localUsersByEmail[$email])) {
                        $user = $localUsersByEmail[$email];
                        $user->update([
                            'name' => $name,
                            'username' => $username,
                            'email' => $email,
                            'role' => $role,
                            'status' => $status,
                            'gate_user_uuid' => $uuid,
                            'sso_synced_at' => now(),
                        ]);
                        $updatedCount++;
                    } elseif (! empty($username) && isset($localUsersByUsername[$username])) {
                        $user = $localUsersByUsername[$username];
                        $user->update([
                            'name' => $name,
                            'username' => $username,
                            'email' => $email,
                            'role' => $role,
                            'status' => $status,
                            'gate_user_uuid' => $uuid,
                            'sso_synced_at' => now(),
                        ]);
                        $updatedCount++;
                    } else {
                        // Buat user baru dengan pre-computed password hash
                        $user = User::create([
                            'name' => $name,
                            'username' => $username,
                            'email' => $email,
                            'role' => $role,
                            'status' => $status,
                            'gate_user_uuid' => $uuid,
                            'password' => $defaultPasswordHash,
                            'sso_synced_at' => now(),
                        ]);
                        $createdCount++;
                    }
                }

                // Simpan ke in-memory map agar konsisten
                if (! empty($uuid)) {
                    $localUsersByUuid[$uuid] = $user;
                }
                if (! empty($username)) {
                    $localUsersByUsername[$username] = $user;
                }
                if (! empty($email)) {
                    $localUsersByEmail[$email] = $user;
                }

                // Hitung statistik berdasarkan role
                if ($role === 'Siswa') {
                    $studentCount++;
                    $nis = $item['nis'] ?: $username;
                    if ($nis) {
                        $existingSiswa = $existingSiswas->get($nis);
                        if ($existingSiswa) {
                            $existingSiswa->update([
                                'nama' => $name,
                                'status' => $status,
                            ]);
                        } else {
                            $newSiswa = Siswa::create([
                                'nis' => $nis,
                                'nama' => $name,
                                'kelas' => 'Umum',
                                'status' => $status,
                            ]);
                            $existingSiswas->put($nis, $newSiswa);
                        }
                    }
                } elseif ($role === 'Ustadz') {
                    $ustadzCount++;
                    $nip = $item['nip'] ?: $username;
                    if ($nip) {
                        $existingUstadz = $existingUstadzs->get($nip);
                        if ($existingUstadz) {
                            $existingUstadz->update([
                                'nama' => $name,
                                'status' => $status,
                            ]);
                        } else {
                            $newUstadz = Ustadz::create([
                                'nip' => $nip,
                                'nama' => $name,
                                'status' => $status,
                            ]);
                            $existingUstadzs->put($nip, $newUstadz);
                        }
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

    /**
     * Cari atau otomatis buatkan akun lokal saat login melalui Gate SSO (OAuth2 / OIDC).
     * Menerapkan aturan peran:
     * - student/siswa/santri => Siswa
     * - admin/superadmin     => Admin
     * - selain itu           => Ustadz
     */
    public function findOrProvisionFromOidc(array $claims): User
    {
        $sub = (string) ($claims['sub'] ?? '');
        $email = $claims['email'] ?? null;
        $gateType = $claims['type'] ?? $claims['user_type'] ?? null;
        $name = $claims['name'] ?? 'Pengguna SSO';
        $nis = $claims['nis'] ?? null;
        $nip = $claims['nip'] ?? null;
        $username = $claims['username'] ?? $nis ?? $nip ?? ($email ? strstr($email, '@', true) : "user_{$sub}");
        $mappedRole = $this->mapRole($gateType);

        // 1. Cari user yang sudah ada berdasarkan sub, uuid, username, atau email
        $user = null;
        if (! empty($sub)) {
            $user = User::where('sso_sub', $sub)->first();
        }
        if (! $user && ! empty($claims['uuid'])) {
            $user = User::where('gate_user_uuid', $claims['uuid'])->first();
        }
        if (! $user && ! empty($username)) {
            $user = User::where('username', $username)->first();
        }
        if (! $user && ! empty($email)) {
            $user = User::where('email', $email)->first();
        }

        if ($user) {
            // Hindari konflik unique email jika email dipegang akun lain
            if (! empty($email)) {
                $conflictEmailUser = User::where('email', $email)->where('id', '!=', $user->id)->first();
                if ($conflictEmailUser) {
                    $conflictEmailUser->update(['email' => "{$conflictEmailUser->username}_{$conflictEmailUser->id}@sabira.local"]);
                }
            }

            // Perbarui data identitas SSO
            $user->forceFill([
                'sso_sub' => $sub ?: $user->sso_sub,
                'sso_synced_at' => now(),
                'name' => $name ?: $user->name,
            ]);

            if (! empty($claims['uuid']) && empty($user->gate_user_uuid)) {
                $user->gate_user_uuid = $claims['uuid'];
            }

            $user->save();
        } else {
            // 2. Buat akun baru otomatis (Auto-provisioning)
            // Hindari tabrakan jika email sudah ada di akun lama
            $conflictEmailUser = ! empty($email) ? User::where('email', $email)->first() : null;
            $conflictUsernameUser = ! empty($username) ? User::where('username', $username)->first() : null;

            if ($conflictEmailUser) {
                $user = $conflictEmailUser;
                $user->update([
                    'name' => $name,
                    'sso_sub' => $sub ?: $user->sso_sub,
                    'sso_synced_at' => now(),
                    'gate_user_uuid' => $claims['uuid'] ?? $user->gate_user_uuid,
                ]);
            } elseif ($conflictUsernameUser) {
                $user = $conflictUsernameUser;
                $user->update([
                    'name' => $name,
                    'email' => $email ?: $user->email,
                    'sso_sub' => $sub ?: $user->sso_sub,
                    'sso_synced_at' => now(),
                    'gate_user_uuid' => $claims['uuid'] ?? $user->gate_user_uuid,
                ]);
            } else {
                $user = User::create([
                    'name' => $name,
                    'username' => $username,
                    'email' => $email ?: "{$username}@sabira.local",
                    'password' => Hash::make(Str::random(32)),
                    'role' => $mappedRole,
                    'status' => 'Aktif',
                    'gate_user_uuid' => $claims['uuid'] ?? null,
                    'sso_sub' => $sub ?: null,
                    'sso_synced_at' => now(),
                ]);
            }

            // Sinkronkan ke tabel Siswa atau Ustadz sesuai role
            if ($mappedRole === 'Siswa') {
                $siswaNis = $nis ?: $username;
                if ($siswaNis) {
                    Siswa::firstOrCreate(
                        ['nis' => $siswaNis],
                        [
                            'nama' => $name,
                            'kelas' => 'Umum',
                            'status' => 'Aktif',
                        ]
                    );
                }
            } elseif ($mappedRole === 'Ustadz') {
                $ustadzNip = $nip ?: $username;
                if ($ustadzNip) {
                    Ustadz::firstOrCreate(
                        ['nip' => $ustadzNip],
                        [
                            'nama' => $name,
                            'status' => 'Aktif',
                        ]
                    );
                }
            }
        }

        return $user;
    }
}
