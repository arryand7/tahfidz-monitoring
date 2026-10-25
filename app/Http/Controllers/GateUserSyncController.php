<?php

namespace App\Http\Controllers;

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

        // Jika ada query ?auto_preview=1 atau dibuka pertama kali, kita bisa jalankan dry run otomatis
        try {
            $dryRunData = $this->syncService->dryRun();
        } catch (Exception $e) {
            $errorMessage = $e->getMessage();
        }

        return Inertia::render('SyncSso', [
            'ssoConfig' => [
                'url' => $this->client->getGateUrl(),
                'hasLocalPath' => ! empty($this->client->getLocalPath()) && is_dir($this->client->getLocalPath()),
                'localPath' => $this->client->getLocalPath(),
            ],
            'initialDryRun' => $dryRunData,
            'initialError' => $errorMessage,
        ]);
    }

    /**
     * Jalankan dry-run ulang (misal setelah refresh / tombol klik)
     */
    public function dryRun()
    {
        try {
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
