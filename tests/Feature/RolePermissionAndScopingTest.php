<?php

namespace Tests\Feature;

use App\Models\RolePermission;
use App\Models\Setoran;
use App\Models\Siswa;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePermissionAndScopingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RolePermission::resetToDefault();
    }

    public function test_admin_can_view_and_update_role_permission_matrix(): void
    {
        $admin = User::factory()->create([
            'role' => 'Admin',
            'status' => 'Aktif',
        ]);

        $response = $this->actingAs($admin)->get(route('kelola.hak-akses'));
        $response->assertOk();

        // Update matriks
        $matrix = RolePermission::getMatrix();
        $matrix['Ustadz']['master_siswa'] = true;

        $updateResponse = $this->actingAs($admin)->post(route('kelola.hak-akses.update'), [
            'matrix' => $matrix,
        ]);
        $updateResponse->assertSessionHas('success');

        $this->assertTrue(RolePermission::isAllowed('Ustadz', 'master_siswa'));

        // Reset matriks
        $resetResponse = $this->actingAs($admin)->post(route('kelola.hak-akses.reset'));
        $resetResponse->assertSessionHas('success');

        // Standar Ustadz master_siswa adalah false
        $this->assertFalse(RolePermission::isAllowed('Ustadz', 'master_siswa'));
    }

    public function test_siswa_is_blocked_from_admin_features(): void
    {
        $siswaUser = User::factory()->create([
            'role' => 'Siswa',
            'username' => 'NIS001',
            'status' => 'Aktif',
        ]);

        // Coba buka Kelola Hak Akses
        $response = $this->actingAs($siswaUser)->get(route('kelola.hak-akses'));
        $response->assertForbidden();

        // Coba buka Input Setoran
        $responseInput = $this->actingAs($siswaUser)->get(route('input.setoran'));
        $responseInput->assertForbidden();

        // Coba buka Database Siswa
        $responseMaster = $this->actingAs($siswaUser)->get(route('master.siswa'));
        $responseMaster->assertForbidden();
    }

    public function test_siswa_can_only_access_their_own_data_and_cannot_export_others(): void
    {
        $ustadz = Ustadz::create([
            'nip' => 'UST001',
            'nama' => 'Ustadz Ahmad',
            'status' => 'Aktif',
        ]);

        $siswaA = Siswa::create([
            'nis' => 'NIS100',
            'nama' => 'Santri Alif',
            'kelas' => 'VII-A',
            'status' => 'Aktif',
        ]);

        $siswaB = Siswa::create([
            'nis' => 'NIS200',
            'nama' => 'Santri Ba',
            'kelas' => 'VII-B',
            'status' => 'Aktif',
        ]);

        $userA = User::factory()->create([
            'name' => 'Santri Alif',
            'username' => 'NIS100',
            'role' => 'Siswa',
            'status' => 'Aktif',
        ]);

        // Setoran untuk Siswa A
        Setoran::create([
            'siswa_id' => $siswaA->id,
            'ustadz_id' => $ustadz->id,
            'jenis' => 'Hafalan',
            'surah' => 'An-Naba',
            'ayat_awal' => '1',
            'ayat_akhir' => '10',
            'nilai' => 'Baik',
            'tanggal' => now()->format('Y-m-d'),
        ]);

        // Setoran untuk Siswa B
        Setoran::create([
            'siswa_id' => $siswaB->id,
            'ustadz_id' => $ustadz->id,
            'jenis' => 'Hafalan',
            'surah' => 'An-Naziat',
            'ayat_awal' => '1',
            'ayat_akhir' => '15',
            'nilai' => 'Baik',
            'tanggal' => now()->format('Y-m-d'),
        ]);

        // 1. Dashboard Santri A
        $dashResponse = $this->actingAs($userA)->get(route('dashboard'));
        $dashResponse->assertOk();
        $dashResponse->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('isStudent', true)
            ->where('stats.totalSiswaSetoran', 1)
            ->where('stats.hafalanBaru', 1)
            ->has('recentLogs', 1)
            ->where('recentLogs.0.detail', 'An-Naba (1-10)')
        );

        // 2. Rekap Setoran Santri A
        $rekapSetoranResponse = $this->actingAs($userA)->get(route('rekap.setoran'));
        $rekapSetoranResponse->assertOk();
        $rekapSetoranResponse->assertInertia(fn ($page) => $page
            ->component('RekapSetoran')
            ->where('isStudent', true)
            ->has('semuaRiwayat', 1)
            ->where('semuaRiwayat.0.surah', 'An-Naba')
        );

        // 3. Rekap Siswa Santri A
        $rekapSiswaResponse = $this->actingAs($userA)->get(route('rekap.siswa'));
        $rekapSiswaResponse->assertOk();
        $rekapSiswaResponse->assertInertia(fn ($page) => $page
            ->component('RekapSiswa')
            ->where('isStudent', true)
            ->has('rekapSiswaData', 1)
            ->where('rekapSiswaData.0.nis', 'NIS100')
        );

        // 4. Santri A mengunduh data miliknya sendiri (Boleh)
        $exportSelfResponse = $this->actingAs($userA)->get(route('rekap.siswa.csv.single', $siswaA->id));
        $exportSelfResponse->assertOk();

        // 5. Santri A mencoba mengunduh data Santri B (Dilarang / 403)
        $exportOtherResponse = $this->actingAs($userA)->get(route('rekap.siswa.csv.single', $siswaB->id));
        $exportOtherResponse->assertForbidden();

        // 6. Santri A mencoba mengunduh PDF Santri B (Dilarang / 403)
        $exportOtherPdfResponse = $this->actingAs($userA)->get(route('rekap.siswa.pdf.single', $siswaB->id));
        $exportOtherPdfResponse->assertForbidden();
    }

    public function test_view_only_permission_allows_reading_but_blocks_mutations(): void
    {
        $ustadzUser = User::factory()->create([
            'role' => 'Ustadz',
            'status' => 'Aktif',
        ]);

        // 1. Awalnya Ustadz 'none' di master_siswa -> Dilarang baca (403)
        $this->actingAs($ustadzUser)->get(route('master.siswa'))->assertForbidden();

        // 2. Beri izin 'view' saja
        RolePermission::updateOrCreate(
            ['role' => 'Ustadz', 'feature' => 'master_siswa'],
            ['access_level' => 'view', 'is_allowed' => true]
        );

        // Ustadz bisa melihat (GET) halaman Database Siswa
        $this->actingAs($ustadzUser)->get(route('master.siswa'))->assertOk();

        // Ustadz dilarang menambah siswa baru (POST) -> 403 Forbidden
        $postData = [
            'nis' => 'NIS999',
            'nama' => 'Santri Baru',
            'kelas' => 'VII-A',
            'status' => 'Aktif',
        ];
        $this->actingAs($ustadzUser)->post(route('master.siswa.store'), $postData)->assertForbidden();

        // 3. Naikkan izin menjadi 'manage'
        RolePermission::updateOrCreate(
            ['role' => 'Ustadz', 'feature' => 'master_siswa'],
            ['access_level' => 'manage', 'is_allowed' => true]
        );

        // Ustadz sekarang bisa menambah data siswa (POST)
        $this->actingAs($ustadzUser)->post(route('master.siswa.store'), $postData)->assertRedirect();
        $this->assertDatabaseHas('siswas', ['nis' => 'NIS999']);
    }

    public function test_admin_lockout_protection_for_kelola_hak_akses(): void
    {
        $admin = User::factory()->create([
            'role' => 'Admin',
            'status' => 'Aktif',
        ]);

        // Coba turunkan kelola_hak_akses Admin menjadi 'none'
        $matrix = RolePermission::getMatrix();
        $matrix['Admin']['kelola_hak_akses'] = 'none';

        $this->actingAs($admin)->post(route('kelola.hak-akses.update'), [
            'matrix' => $matrix,
        ])->assertSessionHas('success');

        // Pastikan tetap 'manage' (proteksi lockout)
        $this->assertTrue(RolePermission::canManage('Admin', 'kelola_hak_akses'));
        $this->assertEquals('manage', RolePermission::getPermissionsForRole('Admin')['kelola_hak_akses']);
    }
}
