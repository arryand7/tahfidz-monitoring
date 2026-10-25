<?php

namespace Tests\Feature;

use App\Models\Siswa;
use App\Models\SsoSetting;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SsoLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Siapkan setting SSO aktif
        SsoSetting::create([
            'base_url' => 'https://gate.sabira-iibs.id',
            'client_id' => 'test-client-id',
            'client_secret' => 'test-client-secret',
            'redirect_uri' => 'http://localhost/sso/callback',
            'scopes' => 'openid profile email roles',
            'driver_mode' => 'auto',
            'is_enabled' => true,
        ]);
    }

    public function test_login_page_renders_with_gate_sso_option(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
    }

    public function test_sso_login_redirects_to_gate_authorize_url(): void
    {
        $response = $this->get('/sso/login');

        $response->assertRedirect();
        $targetUrl = $response->headers->get('Location');

        $this->assertStringContainsString('https://gate.sabira-iibs.id/oauth/authorize', $targetUrl);
        $this->assertStringContainsString('client_id=test-client-id', $targetUrl);
        $this->assertStringContainsString('response_type=code', $targetUrl);
        $response->assertSessionHas('sso_state');
    }

    public function test_sso_callback_rejects_mismatched_state(): void
    {
        session(['sso_state' => 'valid-state-token']);

        $response = $this->get('/sso/callback?code=some-code&state=invalid-state');

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors(['username']);
        $this->assertGuest();
    }

    public function test_sso_callback_successfully_logs_in_and_auto_provisions_student(): void
    {
        session(['sso_state' => 'expected-state-123']);

        // Mock HTTP calls ke Gate SSO
        Http::fake([
            'https://gate.sabira-iibs.id/oauth/token' => Http::response([
                'access_token' => 'mocked-jwt-access-token',
                'token_type' => 'Bearer',
                'expires_in' => 3600,
            ], 200),
            'https://gate.sabira-iibs.id/oauth/userinfo' => Http::response([
                'sub' => 'gate-sub-999',
                'name' => 'Ahmad Santri Baru',
                'email' => 'ahmad@sabira.local',
                'type' => 'student',
                'nis' => 'NIS999',
                'roles' => ['student'],
            ], 200),
        ]);

        $response = $this->get('/sso/callback?code=auth-code-123&state=expected-state-123');

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();

        // Verifikasi User dibuat dengan role Siswa
        $user = User::where('sso_sub', 'gate-sub-999')->first();
        $this->assertNotNull($user);
        $this->assertEquals('Ahmad Santri Baru', $user->name);
        $this->assertEquals('Siswa', $user->role);
        $this->assertEquals('Aktif', $user->status);

        // Verifikasi record di tabel siswas otomatis dibuat
        $siswa = Siswa::where('nis', 'NIS999')->first();
        $this->assertNotNull($siswa);
        $this->assertEquals('Ahmad Santri Baru', $siswa->nama);
    }

    public function test_sso_callback_auto_provisions_teacher_as_ustadz(): void
    {
        session(['sso_state' => 'state-teacher-456']);

        Http::fake([
            'https://gate.sabira-iibs.id/oauth/token' => Http::response([
                'access_token' => 'mocked-teacher-token',
            ], 200),
            'https://gate.sabira-iibs.id/oauth/userinfo' => Http::response([
                'sub' => 'teacher-sub-888',
                'name' => 'Ustadz Abdullah Lc.',
                'email' => 'abdullah@sabira.local',
                'type' => 'teacher',
                'nip' => 'NIP888',
                'roles' => ['teacher'],
            ], 200),
        ]);

        $response = $this->get('/sso/callback?code=teacher-code&state=state-teacher-456');

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();

        $user = User::where('sso_sub', 'teacher-sub-888')->first();
        $this->assertNotNull($user);
        $this->assertEquals('Ustadz', $user->role);

        $ustadz = Ustadz::where('nip', 'NIP888')->first();
        $this->assertNotNull($ustadz);
        $this->assertEquals('Ustadz Abdullah Lc.', $ustadz->nama);
    }

    public function test_sso_callback_rejects_inactive_user(): void
    {
        // Buat user lokal yang dinonaktifkan
        User::factory()->create([
            'sso_sub' => 'inactive-sub-000',
            'username' => 'user_nonaktif',
            'status' => 'Non-Aktif',
            'role' => 'Siswa',
        ]);

        session(['sso_state' => 'state-inactive']);

        Http::fake([
            'https://gate.sabira-iibs.id/oauth/token' => Http::response([
                'access_token' => 'mocked-inactive-token',
            ], 200),
            'https://gate.sabira-iibs.id/oauth/userinfo' => Http::response([
                'sub' => 'inactive-sub-000',
                'name' => 'User Nonaktif',
                'email' => 'inactive@sabira.local',
                'type' => 'student',
            ], 200),
        ]);

        $response = $this->get('/sso/callback?code=inactive-code&state=state-inactive');

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors(['username']);
        $this->assertGuest();
    }

    public function test_sso_settings_can_be_updated_by_admin(): void
    {
        $admin = User::factory()->create([
            'role' => 'Admin',
            'status' => 'Aktif',
        ]);

        $response = $this->actingAs($admin)->post('/sync-sso/settings', [
            'base_url' => 'https://newgate.sabira-iibs.id',
            'client_id' => 'updated-client-id',
            'client_secret' => 'updated-secret',
            'redirect_uri' => 'https://app.sabira-iibs.id/sso/callback',
            'driver_mode' => 'remote_only',
            'is_enabled' => true,
        ]);

        $response->assertRedirect('/sync-sso');

        $current = SsoSetting::current();
        $this->assertEquals('https://newgate.sabira-iibs.id', $current->base_url);
        $this->assertEquals('updated-client-id', $current->client_id);
        $this->assertEquals('updated-secret', $current->client_secret);
        $this->assertEquals('remote_only', $current->driver_mode);
    }

    public function test_sso_test_connection_endpoint(): void
    {
        $admin = User::factory()->create([
            'role' => 'Admin',
            'status' => 'Aktif',
        ]);

        Http::fake([
            'https://gate.sabira-iibs.id/api/provisioning/users' => Http::response([
                'users' => [
                    ['uuid' => 'u1', 'name' => 'Test User', 'type' => 'student'],
                ],
            ], 200),
        ]);

        $response = $this->actingAs($admin)->postJson('/sync-sso/test-connection');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }
}
