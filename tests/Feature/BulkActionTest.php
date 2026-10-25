<?php

namespace Tests\Feature;

use App\Models\Setoran;
use App\Models\Siswa;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BulkActionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $teacher;

    private User $studentUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'Super Administrator',
            'username' => 'admin_test',
            'role' => 'Admin',
            'status' => 'Aktif',
        ]);

        $this->teacher = User::factory()->create([
            'name' => 'Ustadz Pembimbing',
            'username' => 'ustadz_test',
            'role' => 'Ustadz',
            'status' => 'Aktif',
        ]);

        $this->studentUser = User::factory()->create([
            'name' => 'Siswa Santri',
            'username' => 'santri_test',
            'role' => 'Siswa',
            'status' => 'Aktif',
        ]);
    }

    public function test_admin_can_bulk_update_siswa_kelas(): void
    {
        $siswa1 = Siswa::create(['nis' => '1001', 'nama' => 'Santri 1', 'kelas' => '7A', 'status' => 'Aktif']);
        $siswa2 = Siswa::create(['nis' => '1002', 'nama' => 'Santri 2', 'kelas' => '7A', 'status' => 'Aktif']);
        $siswa3 = Siswa::create(['nis' => '1003', 'nama' => 'Santri 3', 'kelas' => '7B', 'status' => 'Aktif']);

        $response = $this->actingAs($this->admin)->post(route('master.siswa.bulk-action'), [
            'action' => 'update_kelas',
            'ids' => [$siswa1->id, $siswa2->id],
            'kelas' => '8A',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('siswas', ['id' => $siswa1->id, 'kelas' => '8A']);
        $this->assertDatabaseHas('siswas', ['id' => $siswa2->id, 'kelas' => '8A']);
        $this->assertDatabaseHas('siswas', ['id' => $siswa3->id, 'kelas' => '7B']);
    }

    public function test_admin_can_bulk_update_siswa_status(): void
    {
        $siswa1 = Siswa::create(['nis' => '1001', 'nama' => 'Santri 1', 'kelas' => '7A', 'status' => 'Aktif']);
        $siswa2 = Siswa::create(['nis' => '1002', 'nama' => 'Santri 2', 'kelas' => '7A', 'status' => 'Aktif']);

        $response = $this->actingAs($this->admin)->post(route('master.siswa.bulk-action'), [
            'action' => 'update_status',
            'ids' => [$siswa1->id, $siswa2->id],
            'status' => 'Non-Aktif',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('siswas', ['id' => $siswa1->id, 'status' => 'Non-Aktif']);
        $this->assertDatabaseHas('siswas', ['id' => $siswa2->id, 'status' => 'Non-Aktif']);
    }

    public function test_admin_can_bulk_delete_siswa_and_cascades_user_accounts(): void
    {
        $siswa1 = Siswa::create(['nis' => '1001', 'nama' => 'Santri 1', 'kelas' => '7A', 'status' => 'Aktif']);
        $user1 = User::factory()->create([
            'name' => 'Santri 1',
            'username' => '1001',
            'role' => 'Siswa',
            'status' => 'Aktif',
        ]);

        $response = $this->actingAs($this->admin)->post(route('master.siswa.bulk-action'), [
            'action' => 'delete',
            'ids' => [$siswa1->id],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseMissing('siswas', ['id' => $siswa1->id]);
        $this->assertDatabaseMissing('users', ['id' => $user1->id]);
    }

    public function test_admin_can_bulk_update_ustadz_status(): void
    {
        $ustadz1 = Ustadz::create(['nip' => 'U01', 'nama' => 'Ustadz 1', 'status' => 'Aktif']);
        $ustadz2 = Ustadz::create(['nip' => 'U02', 'nama' => 'Ustadz 2', 'status' => 'Aktif']);

        $response = $this->actingAs($this->admin)->post(route('master.ustadz.bulk-action'), [
            'action' => 'update_status',
            'ids' => [$ustadz1->id, $ustadz2->id],
            'status' => 'Non-Aktif',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('ustadzs', ['id' => $ustadz1->id, 'status' => 'Non-Aktif']);
        $this->assertDatabaseHas('ustadzs', ['id' => $ustadz2->id, 'status' => 'Non-Aktif']);
    }

    public function test_admin_can_bulk_delete_ustadz_and_cascades_user_accounts(): void
    {
        $ustadz1 = Ustadz::create(['nip' => 'U01', 'nama' => 'Ustadz 1', 'status' => 'Aktif']);
        $userUstadz = User::factory()->create([
            'name' => 'Ustadz 1',
            'username' => 'U01',
            'role' => 'Ustadz',
            'status' => 'Aktif',
        ]);

        $response = $this->actingAs($this->admin)->post(route('master.ustadz.bulk-action'), [
            'action' => 'delete',
            'ids' => [$ustadz1->id],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseMissing('ustadzs', ['id' => $ustadz1->id]);
        $this->assertDatabaseMissing('users', ['id' => $userUstadz->id]);
    }

    public function test_admin_can_bulk_update_user_role_and_reset_password(): void
    {
        $targetUser1 = User::factory()->create(['role' => 'Siswa', 'status' => 'Aktif', 'password' => Hash::make('old_pass')]);
        $targetUser2 = User::factory()->create(['role' => 'Siswa', 'status' => 'Aktif', 'password' => Hash::make('old_pass')]);

        // Bulk role
        $this->actingAs($this->admin)->post(route('kelola.user.bulk-action'), [
            'action' => 'update_role',
            'ids' => [$targetUser1->id, $targetUser2->id],
            'role' => 'Ustadz',
        ])->assertRedirect();

        $this->assertDatabaseHas('users', ['id' => $targetUser1->id, 'role' => 'Ustadz']);
        $this->assertDatabaseHas('users', ['id' => $targetUser2->id, 'role' => 'Ustadz']);

        // Bulk reset password
        $this->actingAs($this->admin)->post(route('kelola.user.bulk-action'), [
            'action' => 'reset_password',
            'ids' => [$targetUser1->id, $targetUser2->id],
        ])->assertRedirect();

        $targetUser1->refresh();
        $this->assertTrue(Hash::check('sabira123', $targetUser1->password));
    }

    public function test_admin_cannot_bulk_delete_own_account(): void
    {
        $response = $this->actingAs($this->admin)->postJson(route('kelola.user.bulk-action'), [
            'action' => 'delete',
            'ids' => [$this->admin->id],
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }

    public function test_admin_can_delete_setoran_individually_and_in_bulk(): void
    {
        $ustadz = Ustadz::create(['nip' => 'U99', 'nama' => 'Ustadz Test', 'status' => 'Aktif']);
        $siswa = Siswa::create(['nis' => '1001', 'nama' => 'Santri 1', 'kelas' => '7A', 'status' => 'Aktif']);

        $setoran1 = Setoran::create([
            'siswa_id' => $siswa->id,
            'ustadz_id' => $ustadz->id,
            'jenis' => 'Hafalan',
            'surah' => 'An-Naba',
            'ayat_awal' => '1',
            'ayat_akhir' => '10',
            'nilai' => 'Baik',
            'tanggal' => now()->toDateString(),
        ]);
        $setoran2 = Setoran::create([
            'siswa_id' => $siswa->id,
            'ustadz_id' => $ustadz->id,
            'jenis' => 'Murojaah',
            'surah' => 'An-Nazi\'at',
            'ayat_awal' => '1',
            'ayat_akhir' => '10',
            'nilai' => 'Baik',
            'tanggal' => now()->toDateString(),
        ]);

        // Single delete
        $this->actingAs($this->admin)->delete(route('rekap.setoran.destroy', $setoran1->id))
            ->assertRedirect();
        $this->assertDatabaseMissing('setorans', ['id' => $setoran1->id]);

        // Bulk delete
        $this->actingAs($this->admin)->post(route('rekap.setoran.bulk-action'), [
            'action' => 'delete',
            'ids' => [$setoran2->id],
        ])->assertRedirect();
        $this->assertDatabaseMissing('setorans', ['id' => $setoran2->id]);
    }

    public function test_non_admin_cannot_access_bulk_actions(): void
    {
        $siswa = Siswa::create(['nis' => '1001', 'nama' => 'Santri 1', 'kelas' => '7A', 'status' => 'Aktif']);

        // Teacher attempted bulk action on Siswa
        $this->actingAs($this->teacher)->post(route('master.siswa.bulk-action'), [
            'action' => 'update_status',
            'ids' => [$siswa->id],
            'status' => 'Non-Aktif',
        ])->assertForbidden();

        // Student attempted bulk action on Siswa
        $this->actingAs($this->studentUser)->post(route('master.siswa.bulk-action'), [
            'action' => 'delete',
            'ids' => [$siswa->id],
        ])->assertForbidden();

        // Teacher attempted bulk action on Users
        $this->actingAs($this->teacher)->post(route('kelola.user.bulk-action'), [
            'action' => 'update_role',
            'ids' => [$this->studentUser->id],
            'role' => 'Admin',
        ])->assertForbidden();

        // Student attempted bulk delete on Setoran
        $this->actingAs($this->studentUser)->post(route('rekap.setoran.bulk-action'), [
            'action' => 'delete',
            'ids' => [1],
        ])->assertForbidden();
    }
}
