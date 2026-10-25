<?php

namespace App\Services;

use App\Models\SsoSetting;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PDO;

class GateProvisioningClient
{
    protected SsoSetting $setting;

    protected string $gateUrl;

    protected ?string $clientId;

    protected ?string $clientSecret;

    protected ?string $localPath;

    protected string $driverMode;

    public function __construct(?SsoSetting $setting = null)
    {
        $this->setting = $setting ?? SsoSetting::current();
        $this->gateUrl = $this->setting->getEffectiveBaseUrl();
        $this->clientId = $this->setting->getEffectiveClientId();
        $this->clientSecret = $this->setting->getEffectiveClientSecret();
        $this->localPath = $this->setting->getEffectiveLocalPath();
        $this->driverMode = $this->setting->driver_mode ?: 'auto';
    }

    /**
     * Segarkan konfigurasi dari database/setting terkini.
     */
    public function reload(): self
    {
        $this->setting = SsoSetting::current();
        $this->gateUrl = $this->setting->getEffectiveBaseUrl();
        $this->clientId = $this->setting->getEffectiveClientId();
        $this->clientSecret = $this->setting->getEffectiveClientSecret();
        $this->localPath = $this->setting->getEffectiveLocalPath();
        $this->driverMode = $this->setting->driver_mode ?: 'auto';

        return $this;
    }

    public function getSetting(): SsoSetting
    {
        return $this->setting;
    }

    public function getGateUrl(): string
    {
        return $this->gateUrl;
    }

    public function getClientId(): ?string
    {
        return $this->clientId;
    }

    public function getClientSecret(): ?string
    {
        return $this->clientSecret;
    }

    public function getLocalPath(): ?string
    {
        return $this->localPath;
    }

    public function getDriverMode(): string
    {
        return $this->driverMode;
    }

    protected function getHeaders(): array
    {
        return [
            'X-Client-Id' => $this->clientId ?? '',
            'X-Client-Secret' => $this->clientSecret ?? '',
            'Accept' => 'application/json',
        ];
    }

    /**
     * Uji koneksi ke Gate SSO secara langsung.
     * Menguji HTTP endpoint dan mengukur waktu respons (latency).
     */
    public function testConnection(): array
    {
        $startTime = microtime(true);
        $result = [
            'success' => false,
            'url' => $this->gateUrl,
            'driver_mode' => $this->driverMode,
            'latency_ms' => 0,
            'source' => 'remote_api',
            'status_code' => null,
            'message' => '',
            'has_local_fallback' => $this->hasValidLocalDatabase(),
        ];

        try {
            // Jika mode bukan local_only, kita ping remote endpoint
            if ($this->driverMode !== 'local_only') {
                $endpoint = "{$this->gateUrl}/api/provisioning/users";
                $headers = $this->getHeaders();

                $response = Http::withHeaders($headers)
                    ->timeout(8)
                    ->get($endpoint);

                $latency = (int) round((microtime(true) - $startTime) * 1000);
                $result['latency_ms'] = $latency;
                $result['status_code'] = $response->status();

                if ($response->successful()) {
                    $json = $response->json();
                    $userCount = isset($json['users']) && is_array($json['users']) ? count($json['users']) : 0;
                    $result['success'] = true;
                    $result['message'] = "Terhubung dengan sukses ke Gate SSO ({$this->gateUrl})! Ditemukan {$userCount} pengguna.";
                } elseif ($response->status() === 401 || $response->status() === 403) {
                    $result['message'] = "Koneksi ke server Gate SSO berhasil, namun otentikasi ditolak (HTTP {$response->status()}). Periksa Client ID & Client Secret Anda.";
                } elseif ($response->status() === 404) {
                    // Endpoint provisioning mungkin belum dipasang, coba ping base URL
                    $pingResponse = Http::timeout(5)->get($this->gateUrl);
                    if ($pingResponse->successful() || $pingResponse->status() < 500) {
                        $result['message'] = "Gate SSO dapat dihubungi (HTTP {$pingResponse->status()}), namun endpoint API /api/provisioning/users tidak ditemukan (404).";
                    } else {
                        $result['message'] = "Gate SSO merespons dengan HTTP {$response->status()}.";
                    }
                } else {
                    $result['message'] = "Gate SSO merespons dengan error HTTP {$response->status()}: ".Str::limit($response->body(), 100);
                }
            } else {
                // local_only mode
                if ($this->hasValidLocalDatabase()) {
                    $result['success'] = true;
                    $result['source'] = 'local_sqlite';
                    $result['message'] = 'Koneksi ke database lokal Gate SSO SQLite valid dan siap digunakan.';
                } else {
                    $result['message'] = "Direktori atau database lokal Gate SSO tidak ditemukan di: {$this->localPath}";
                }
            }
        } catch (Exception $e) {
            $latency = (int) round((microtime(true) - $startTime) * 1000);
            $result['latency_ms'] = $latency;
            $result['message'] = 'Gagal menghubungi Gate SSO: '.$e->getMessage();

            if ($this->driverMode === 'auto' && $this->hasValidLocalDatabase()) {
                $result['message'] .= ' (Tersedia cadangan database lokal di '.$this->localPath.')';
            }
        }

        // Catat hasil tes ke database settings
        $this->setting->update([
            'last_tested_at' => now(),
            'last_test_status' => $result['success'] ? 'success' : 'failed',
            'last_test_message' => $result['message'],
        ]);

        return $result;
    }

    /**
     * Cek apakah database SQLite lokal Gate SSO ada dan valid.
     */
    public function hasValidLocalDatabase(): bool
    {
        if (empty($this->localPath) || ! is_dir($this->localPath)) {
            return false;
        }

        $sqlitePath = rtrim($this->localPath, '/').'/database/database.sqlite';

        return file_exists($sqlitePath);
    }

    /**
     * Ambil data pengguna dari Gate SSO.
     * Mendukung pemanggilan dinamis via Remote REST API saat di-deploy (production)
     * dan fallback SQLite lokal saat pengembangan lokal.
     */
    public function fetchCanonicalUsers(): array
    {
        $httpError = null;

        // 1. Coba koneksi via Remote Provisioning API jika mode 'auto' atau 'remote_only'
        if ($this->driverMode !== 'local_only') {
            if (! empty($this->clientId) && ! empty($this->clientSecret)) {
                try {
                    $response = Http::withHeaders($this->getHeaders())
                        ->timeout(12)
                        ->get("{$this->gateUrl}/api/provisioning/users");

                    if ($response->successful()) {
                        $data = $response->json();
                        if (isset($data['users']) && is_array($data['users'])) {
                            return [
                                'source' => 'remote_api',
                                'origin' => $this->gateUrl,
                                'total' => count($data['users']),
                                'users' => $data['users'],
                            ];
                        }
                    } else {
                        $httpError = 'HTTP '.$response->status().': '.Str::limit($response->body(), 120);
                        Log::warning("Gagal fetch dari Gate SSO Remote API: {$httpError}");
                    }
                } catch (Exception $e) {
                    $httpError = $e->getMessage();
                    Log::warning("Exception saat fetch Gate SSO Remote API: {$httpError}");
                }
            } else {
                $httpError = 'Client ID atau Client Secret Gate SSO belum diisi.';
            }

            // Jika driver mode remote_only, langsung lemparkan error tanpa fallback ke lokal
            if ($this->driverMode === 'remote_only') {
                throw new Exception("Koneksi ke Remote API Gate SSO ({$this->gateUrl}) gagal: {$httpError}");
            }
        }

        // 2. Fallback: Coba baca database lokal Gate SSO jika mode 'auto' atau 'local_only'
        if ($this->hasValidLocalDatabase()) {
            $sqlitePath = rtrim($this->localPath, '/').'/database/database.sqlite';

            try {
                $pdo = new PDO('sqlite:'.$sqlitePath);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

                $stmt = $pdo->query('SELECT uuid, name, username, email, type, nis, nip, status FROM users');
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

                $canonicalUsers = array_map(function ($row) {
                    return [
                        'uuid' => $row['uuid'],
                        'gate_user_uuid' => $row['uuid'],
                        'name' => $row['name'],
                        'username' => $row['username'],
                        'email' => $row['email'],
                        'type' => $row['type'],
                        'user_type' => $row['type'],
                        'nis' => $row['nis'],
                        'nip' => $row['nip'],
                        'status' => $row['status'],
                    ];
                }, $rows);

                return [
                    'source' => 'local_sqlite',
                    'origin' => $sqlitePath,
                    'total' => count($canonicalUsers),
                    'users' => $canonicalUsers,
                ];
            } catch (Exception $e) {
                Log::error("Gagal membaca database lokal Gate SSO di {$sqlitePath}: ".$e->getMessage());
            }
        }

        // 3. Jika semua cara gagal
        $reason = $httpError
            ? "Koneksi ke Remote API ({$this->gateUrl}) gagal ({$httpError}) dan cadangan database lokal di ({$this->localPath}) tidak dapat diakses."
            : "Kredensial Gate SSO belum dikonfigurasi dan database lokal di ({$this->localPath}) tidak ditemukan.";

        throw new Exception("Tidak dapat mengambil data pengguna dari Gate SSO: {$reason}");
    }

    /**
     * Kirim status/laporan hasil sinkronisasi kembali ke Gate SSO (jika memakai Remote API).
     */
    public function sendSyncResults(array $items): bool
    {
        if (empty($this->clientId) || empty($this->clientSecret)) {
            return false;
        }

        try {
            $response = Http::withHeaders($this->getHeaders())
                ->timeout(10)
                ->post("{$this->gateUrl}/api/provisioning/sync-results", [
                    'items' => $items,
                ]);

            return $response->successful();
        } catch (Exception $e) {
            Log::error('Exception saat kirim sync-results ke Gate SSO: '.$e->getMessage());

            return false;
        }
    }
}
