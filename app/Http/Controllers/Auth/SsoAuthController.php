<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SsoSetting;
use App\Services\GateUserSyncService;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SsoAuthController extends Controller
{
    /**
     * Arahkan pengguna ke halaman login / otorisasi Gate SSO.
     */
    public function redirect(Request $request): RedirectResponse
    {
        $setting = SsoSetting::current();

        if (! $setting->is_enabled) {
            return redirect()->route('login')->withErrors([
                'username' => 'Metode login Gate SSO sedang dinonaktifkan oleh administrator.',
            ]);
        }

        $baseUrl = $setting->getEffectiveBaseUrl();
        $clientId = $setting->getEffectiveClientId();
        $clientSecret = $setting->getEffectiveClientSecret();
        $redirectUri = $setting->getEffectiveRedirectUri();
        $scopes = $setting->getEffectiveScopes();

        if (empty($baseUrl) || empty($clientId) || empty($clientSecret)) {
            return redirect()->route('login')->withErrors([
                'username' => 'Gate SSO belum selesai dikonfigurasi (Client ID / Secret kosong). Silakan atur di menu Sinkronisasi Gate SSO.',
            ]);
        }

        $state = Str::random(40);
        $request->session()->put('sso_state', $state);
        $request->session()->put('sso_intended', $request->input('intended'));
        $request->session()->put('sso_redirect_uri', $redirectUri);

        $authorizeUrl = $baseUrl.'/oauth/authorize?'.http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => $scopes,
            'state' => $state,
        ]);

        return redirect()->away($authorizeUrl);
    }

    /**
     * Tangani callback OAuth2 setelah pengguna mengizinkan di Gate SSO.
     */
    public function callback(Request $request, GateUserSyncService $syncService): RedirectResponse
    {
        // 1. Periksa apakah ada error yang dikirimkan oleh Gate SSO
        if ($request->has('error')) {
            $desc = $request->input('error_description') ?: $request->input('error');

            return $this->fail('Login Gate SSO dibatalkan atau ditolak: '.$desc);
        }

        // 2. Validasi CSRF state token
        if (! $this->isValidState($request)) {
            return $this->fail('Sesi login Gate SSO tidak valid atau telah kedaluwarsa. Silakan coba lagi.');
        }

        $code = $request->input('code');
        if (! $code) {
            return $this->fail('Kode otorisasi dari Gate SSO tidak ditemukan.');
        }

        $setting = SsoSetting::current();
        $baseUrl = $setting->getEffectiveBaseUrl();
        $clientId = $setting->getEffectiveClientId();
        $clientSecret = $setting->getEffectiveClientSecret();
        $redirectUri = (string) $request->session()->pull('sso_redirect_uri') ?: $setting->getEffectiveRedirectUri();

        // 3. Tukar authorization code dengan access token
        try {
            $tokenResponse = Http::asForm()
                ->timeout(15)
                ->post("{$baseUrl}/oauth/token", [
                    'grant_type' => 'authorization_code',
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'redirect_uri' => $redirectUri,
                    'code' => $code,
                ]);

            if (! $tokenResponse->successful()) {
                $errMsg = $tokenResponse->json('error_description')
                    ?: $tokenResponse->json('message')
                    ?: ('HTTP '.$tokenResponse->status());
                Log::error('Gate SSO Token Exchange Failed', [
                    'status' => $tokenResponse->status(),
                    'body' => $tokenResponse->body(),
                ]);

                return $this->fail("Gagal menukar token dengan Gate SSO: {$errMsg}");
            }

            $accessToken = $tokenResponse->json('access_token');
            if (! $accessToken) {
                return $this->fail('Access token tidak ditemukan dalam respons Gate SSO.');
            }

            // 4. Ambil profil user dari endpoint userinfo OIDC
            $userInfoResponse = Http::withToken($accessToken)
                ->timeout(15)
                ->get("{$baseUrl}/oauth/userinfo");

            if (! $userInfoResponse->successful()) {
                Log::error('Gate SSO UserInfo Fetch Failed', [
                    'status' => $userInfoResponse->status(),
                    'body' => $userInfoResponse->body(),
                ]);

                return $this->fail('Gagal mengambil data profil dari Gate SSO (HTTP '.$userInfoResponse->status().').');
            }

            $claims = $userInfoResponse->json();
            $sub = $claims['sub'] ?? null;

            if (! $sub) {
                return $this->fail('Gate SSO tidak mengembalikan identitas pengguna (claim sub) yang valid.');
            }

            // 5. Cari atau auto-provision user lokal sesuai aturan peran
            $user = $syncService->findOrProvisionFromOidc($claims);

            // 6. Periksa status keaktifan user
            if (! $user->isAktif()) {
                return $this->fail("Akun Anda ({$user->username}) saat ini berstatus Non-Aktif. Silakan hubungi Administrator.");
            }

            // 7. Login ke session aplikasi
            Auth::login($user, true);
            $request->session()->regenerate();

            // 8. Redirect ke halaman yang dituju sebelumnya atau dashboard
            $intended = $request->session()->pull('sso_intended');
            if ($intended && filter_var($intended, FILTER_VALIDATE_URL)) {
                return redirect($intended);
            }

            return redirect()->intended(route('dashboard'));

        } catch (Exception $e) {
            Log::error('Exception during SSO Callback: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->fail('Terjadi kesalahan saat memproses login Gate SSO: '.$e->getMessage());
        }
    }

    protected function isValidState(Request $request): bool
    {
        $state = (string) $request->input('state');
        $expected = (string) $request->session()->pull('sso_state');

        return $state !== '' && $expected !== '' && hash_equals($expected, $state);
    }

    protected function fail(string $message): RedirectResponse
    {
        return redirect()->route('login')->withErrors([
            'username' => $message,
            'sso' => $message,
        ]);
    }
}
