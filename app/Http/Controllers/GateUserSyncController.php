<?php

namespace App\Http\Controllers;

use App\Models\SsoSetting;
use App\Services\GateProvisioningClient;
use App\Services\GateUserSyncService;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GateUserSyncController extends Controller
{
    protected GateUserSyncService $syncService;

    protected GateProvisioningClient $client;

    public function __construct(GateUserSyncService $syncService, GateProvisioningClient $client)
    {
        $this->syncService = $syncService;
        $this->client = $client;
    }

    /**
     * Tampilkan halaman Sinkronisasi Gate SSO.
     */
    public function index(Request $request)
    {
        $dryRunData = null;
        $errorMessage = null;

        $setting = SsoSetting::current();
        $this->client->reload();

        try {
            $dryRunData = $this->syncService->dryRun();
        } catch (Exception $e) {
            $errorMessage = $e->getMessage();
        }

        return Inertia::render('SyncSso', [
            'ssoConfig' => [
                'base_url' => $setting->getEffectiveBaseUrl(),
                'client_id' => $setting->getEffectiveClientId(),
                'has_secret' => ! empty($setting->getEffectiveClientSecret()),
                'redirect_uri' => $setting->getEffectiveRedirectUri(),
                'scopes' => $setting->getEffectiveScopes(),
                'local_path' => $setting->getEffectiveLocalPath(),
                'driver_mode' => $setting->driver_mode ?: 'auto',
                'is_enabled' => (bool) $setting->is_enabled,
                'hasLocalPath' => ! empty($this->client->getLocalPath()) && is_dir($this->client->getLocalPath()),
                'last_tested_at' => $setting->last_tested_at?->toIso8601String(),
                'last_test_status' => $setting->last_test_status,
                'last_test_message' => $setting->last_test_message,
            ],
            'initialDryRun' => $dryRunData,
            'initialError' => $errorMessage,
        ]);
    }

    /**
     * Update pengaturan Gate SSO secara dinamis dari antarmuka web.
     */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'base_url' => ['nullable', 'url', 'max:255'],
            'client_id' => ['nullable', 'string', 'max:255'],
            'client_secret' => ['nullable', 'string', 'max:255'],
            'redirect_uri' => ['nullable', 'url', 'max:255'],
            'scopes' => ['nullable', 'string', 'max:255'],
            'local_path' => ['nullable', 'string', 'max:255'],
            'driver_mode' => ['nullable', 'string', 'in:auto,remote_only,local_only'],
            'is_enabled' => ['nullable', 'boolean'],
        ]);

        $setting = SsoSetting::current();

        $baseUrl = trim((string) ($validated['base_url'] ?? ''));
        $setting->base_url = $baseUrl !== '' ? rtrim($baseUrl, '/') : null;

        $clientId = trim((string) ($validated['client_id'] ?? ''));
        $setting->client_id = $clientId !== '' ? $clientId : null;

        $redirectUri = trim((string) ($validated['redirect_uri'] ?? ''));
        $setting->redirect_uri = $redirectUri !== '' ? $redirectUri : null;

        $scopes = trim((string) ($validated['scopes'] ?? ''));
        $setting->scopes = $scopes !== '' ? $scopes : 'openid profile email roles';

        $localPath = trim((string) ($validated['local_path'] ?? ''));
        $setting->local_path = $localPath !== '' ? $localPath : null;

        if (! empty($validated['driver_mode'])) {
            $setting->driver_mode = $validated['driver_mode'];
        }

        if (isset($validated['is_enabled'])) {
            $setting->is_enabled = (bool) $validated['is_enabled'];
        }

        if (! empty($validated['client_secret'])) {
            $setting->client_secret = trim((string) $validated['client_secret']);
        }

        $setting->save();
        $this->client->reload();

        return redirect()->route('sync.sso')->with('flash', [
            'type' => 'success',
            'message' => 'Pengaturan Gate SSO berhasil diperbarui.',
        ]);
    }

    /**
     * Endpoint API untuk mengetes koneksi ke Gate SSO secara langsung.
     */
    public function testConnection()
    {
        $this->client->reload();
        $result = $this->client->testConnection();

        return response()->json($result);
    }

    /**
     * Jalankan dry-run ulang (misal setelah refresh / tombol klik)
     */
    public function dryRun()
    {
        try {
            $this->client->reload();
            $data = $this->syncService->dryRun();

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Terapkan sinkronisasi untuk pengguna yang dipilih/dicentang
     */
    public function apply(Request $request)
    {
        if (function_exists('set_time_limit')) {
            @set_time_limit(300);
        }

        $request->validate([
            'selected_uuids' => 'required|array|min:1',
            'selected_uuids.*' => 'required|string',
        ], [
            'selected_uuids.required' => 'Pilih setidaknya satu pengguna untuk disinkronkan.',
            'selected_uuids.min' => 'Pilih setidaknya satu pengguna untuk disinkronkan.',
        ]);

        try {
            $result = $this->syncService->applySync($request->input('selected_uuids'));

            return redirect()->route('sync.sso')->with('flash', [
                'type' => 'success',
                'message' => $result['message'],
                'result' => $result,
            ]);
        } catch (Exception $e) {
            return redirect()->back()->with('flash', [
                'type' => 'error',
                'message' => 'Gagal menerapkan sinkronisasi: '.$e->getMessage(),
            ]);
        }
    }
}
