<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use PDO;

class GateProvisioningClient
{
    protected string $gateUrl;

    protected ?string $clientId;

    protected ?string $clientSecret;

    protected ?string $localPath;

    public function __construct()
    {
        $this->gateUrl = rtrim(config('services.gate.url', 'https://gate.sabira-iibs.id'), '/');
        $this->clientId = config('services.gate.client_id');
        $this->clientSecret = config('services.gate.client_secret');
        $this->localPath = config('services.gate.local_path', '/Users/ryand/Documents/LARAVEL/sabira/gate-sso');
    }

    public function getGateUrl(): string
    {
        return $this->gateUrl;
    }

    public function getLocalPath(): ?string
    {
        return $this->localPath;
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
     * Ambil data pengguna dari Gate SSO.
     * Prioritas 1: Remote API (https://gate.sabira-iibs.id/api/provisioning/users)
     * Prioritas 2 (Fallback / Local Dev): Membaca database SQLite Gate SSO lokal jika tersedia.
     */
    public function fetchCanonicalUsers(): array
    {
        $httpError = null;

        // 1. Coba koneksi via Remote Provisioning API jika credentials tersedia
        if (! empty($this->clientId) && ! empty($this->clientSecret)) {
            try {
                $response = Http::withHeaders($this->getHeaders())
                    ->timeout(10)
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
                    $httpError = 'HTTP '.$response->status().': '.$response->body();
                    Log::warning("Gagal fetch dari Gate SSO Remote API: {$httpError}");
                }
            } catch (Exception $e) {
                $httpError = $e->getMessage();
                Log::warning("Exception saat fetch Gate SSO Remote API: {$httpError}");
            }
        }

        // 2. Fallback: Coba baca database lokal Gate SSO jika direktori lokal tersedia
        if ($this->localPath && is_dir($this->localPath)) {
            $sqlitePath = rtrim($this->localPath, '/').'/database/database.sqlite';

            if (file_exists($sqlitePath)) {
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
        }

        // 3. Jika kedua cara gagal
        $reason = $httpError
            ? "Koneksi ke Remote API ({$this->gateUrl}) gagal ({$httpError}) dan database lokal di ({$this->localPath}) tidak dapat diakses."
            : "Kredensial SSO_CLIENT_ID / SSO_CLIENT_SECRET belum diisi di .env dan database lokal Gate SSO di ({$this->localPath}) tidak ditemukan.";

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
