<?php

namespace Tests\Feature;

use App\Models\Siswa;
use App\Models\User;
use App\Models\Ustadz;
use App\Services\GateProvisioningClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class GateUserSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function createAdminUser(): User
    {
        return User::factory()->create([
            'username' => 'admin_test',
            'role' => 'Admin',
            'status' => 'Aktif',
        ]);
    }

    public function test_guest_cannot_access_sync_sso(): void
    {
        $response = $this->get('/sync-sso');
        $response->assertRedirect('/login');
    }

    public function test_admin_can_access_sync_sso_page(): void
    {
        $admin = $this->createAdminUser();

        $response = $this->actingAs($admin)->get('/sync-sso');
        $response->assertStatus(200);
    }

    public function test_dry_run_endpoint_returns_json_reconciliation(): void
    {
        $admin = $this->createAdminUser();

        $response = $this->actingAs($admin)->postJson('/sync-sso/dry-run');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'source',
                    'origin',
                    'summary' => ['total', 'new', 'update', 'matched'],
                    'items',
                ],
            ]);
    }

    public function test_apply_sync_creates_and_maps_users_according_to_rules(): void
    {
        $admin = $this->createAdminUser();

        // Mock GateProvisioningClient untuk mensimulasikan berbagai tipe user Gate SSO
        $mockClient = Mockery::mock(GateProvisioningClient::class);
        $mockClient->shouldReceive('getGateUrl')->andReturn('https://gate.sabira-iibs.id');
        $mockClient->shouldReceive('getLocalPath')->andReturn(null);
        $mockClient->shouldReceive('sendSyncResults')->andReturn(true);
        $mockClient->shouldReceive('fetchCanonicalUsers')->andReturn([
            'source' => 'mock_test',
            'origin' => 'mock_test_origin',
            'total' => 3,
            'users' => [
                [
                    'uuid' => 'uuid-student-1',
                    'name' => 'Santri Budi',
                    'username' => 'santri_budi',
                    'email' => 'budi@sabira.test',
                    'type' => 'student',
                    'nis' => 'NIS202601',
                    'nip' => null,
                    'status' => 'active',
                ],
                [
                    'uuid' => 'uuid-admin-1',
                    'name' => 'Admin Utama',
                    'username' => 'gate_admin',
                    'email' => 'gate_admin@sabira.test',
                    'type' => 'admin',
                    'nis' => null,
                    'nip' => null,
                    'status' => 'active',
                ],
                [
                    'uuid' => 'uuid-teacher-1',
                    'name' => 'Ustadz Ahmad',
                    'username' => 'ust_ahmad',
                    'email' => 'ahmad@sabira.test',
                    'type' => 'teacher',
                    'nis' => null,
                    'nip' => 'NIP198501',
                    'status' => 'active',
                ],
            ],
        ]);

        $this->app->instance(GateProvisioningClient::class, $mockClient);

        // Apply sinkronisasi untuk 3 user di atas
        $response = $this->actingAs($admin)->post('/sync-sso/apply', [
            'selected_uuids' => ['uuid-student-1', 'uuid-admin-1', 'uuid-teacher-1'],
        ]);

        $response->assertRedirect(route('sync.sso'));

        // 1. Verifikasi Siswa (student -> Siswa)
        $this->assertDatabaseHas('users', [
            'gate_user_uuid' => 'uuid-student-1',
            'username' => 'santri_budi',
            'role' => 'Siswa',
            'status' => 'Aktif',
        ]);
        $this->assertDatabaseHas('siswas', [
            'nis' => 'NIS202601',
            'nama' => 'Santri Budi',
        ]);

        // 2. Verifikasi Admin (admin -> Admin)
        $this->assertDatabaseHas('users', [
            'gate_user_uuid' => 'uuid-admin-1',
            'username' => 'gate_admin',
            'role' => 'Admin',
            'status' => 'Aktif',
        ]);

        // 3. Verifikasi Ustadz/Teacher (teacher -> Ustadz)
        $this->assertDatabaseHas('users', [
            'gate_user_uuid' => 'uuid-teacher-1',
            'username' => 'ust_ahmad',
            'role' => 'Ustadz',
            'status' => 'Aktif',
        ]);
        $this->assertDatabaseHas('ustadzs', [
            'nip' => 'NIP198501',
            'nama' => 'Ustadz Ahmad',
        ]);
    }
}
