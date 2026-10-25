<?php

namespace Tests\Feature;

use App\Models\RolePermission;
use App\Models\Siswa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class SiswaImportDryRunAndMergerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RolePermission::resetToDefault();
    }

    public function test_template_download_returns_csv_file(): void
    {
        $admin = User::factory()->create(['role' => 'Admin', 'status' => 'Aktif']);

        $response = $this->actingAs($admin)->get(route('siswa.template'));
        $response->assertOk();
        $response->assertHeader('Content-Disposition', 'attachment; filename=Template_Import_Siswa.csv');
    }

    public function test_dry_run_correctly_classifies_new_update_same_and_invalid(): void
    {
        $admin = User::factory()->create(['role' => 'Admin', 'status' => 'Aktif']);

        // Siswa yang sudah ada di database
        Siswa::create([
            'nis' => 'NIS001',
            'nama' => 'Santri Lama Satu',
            'kelas' => 'VII-A',
            'status' => 'Aktif',
        ]);

        Siswa::create([
            'nis' => 'NIS002',
            'nama' => 'Santri Sama Persis',
            'kelas' => 'VII-B',
            'status' => 'Aktif',
        ]);

        // Buat file CSV untuk diuji:
        // Baris 1: Header
        // Baris 2: NIS001 -> nama dan kelas berubah (akan menjadi UPDATE / MERGER)
        // Baris 3: NIS002 -> nama dan kelas identik (akan menjadi SAME)
        // Baris 4: NIS003 -> santri baru (akan menjadi NEW)
        // Baris 5: NIS kosong -> (akan menjadi INVALID)
        $csvContent = implode("\n", [
            'NIS,Nama Lengkap,Kelas,Status',
            'NIS001,Santri Lama Update,VIII-A,Aktif',
            'NIS002,Santri Sama Persis,VII-B,Aktif',
            'NIS003,Santri Baru Tiga,VII-A,Aktif',
            ',Santri Tanpa NIS,VII-C,Aktif',
        ]);

        $file = UploadedFile::fake()->createWithContent('import_test.csv', $csvContent);

        $response = $this->actingAs($admin)->post(route('master.siswa.dry-run'), [
            'file' => $file,
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'summary' => [
                'total' => 4,
                'new' => 1,
                'update' => 1,
                'same' => 1,
                'invalid' => 1,
            ],
        ]);

        $items = $response->json('items');
        $this->assertCount(4, $items);

        // Cek baris update
        $updateItem = collect($items)->firstWhere('nis', 'NIS001');
        $this->assertEquals('update', $updateItem['action']);
        $this->assertEquals('Santri Lama Satu', $updateItem['changes']['nama']['old']);
        $this->assertEquals('Santri Lama Update', $updateItem['changes']['nama']['new']);
        $this->assertEquals('VII-A', $updateItem['changes']['kelas']['old']);
        $this->assertEquals('VIII-A', $updateItem['changes']['kelas']['new']);

        // Cek baris same
        $sameItem = collect($items)->firstWhere('nis', 'NIS002');
        $this->assertEquals('same', $sameItem['action']);

        // Cek baris new
        $newItem = collect($items)->firstWhere('nis', 'NIS003');
        $this->assertEquals('new', $newItem['action']);

        // Cek baris invalid
        $invalidItem = collect($items)->firstWhere('action', 'invalid');
        $this->assertNotNull($invalidItem['error']);
    }

    public function test_apply_import_creates_new_students_and_merges_existing(): void
    {
        $admin = User::factory()->create(['role' => 'Admin', 'status' => 'Aktif']);

        // Siswa awal
        $existing = Siswa::create([
            'nis' => 'NIS100',
            'nama' => 'Santri Awal',
            'kelas' => 'VII-A',
            'status' => 'Aktif',
        ]);

        // Akun user untuk siswa awal
        $userStudent = User::factory()->create([
            'username' => 'NIS100',
            'name' => 'Santri Awal',
            'role' => 'Siswa',
            'status' => 'Aktif',
        ]);

        $payload = [
            'items' => [
                // 1. Merger NIS100 (nama & kelas diupdate)
                [
                    'nis' => 'NIS100',
                    'nama' => 'Santri Awal Dimerge',
                    'kelas' => 'VIII-B',
                    'status' => 'Aktif',
                ],
                // 2. Tambah santri baru NIS200
                [
                    'nis' => 'NIS200',
                    'nama' => 'Santri Baru Kedua',
                    'kelas' => 'VII-A',
                    'status' => 'Aktif',
                ],
            ],
        ];

        $response = $this->actingAs($admin)->postJson(route('master.siswa.apply-import'), $payload);
        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'created_count' => 1,
            'updated_count' => 1,
        ]);

        // Verifikasi database siswa diupdate
        $this->assertDatabaseHas('siswas', [
            'nis' => 'NIS100',
            'nama' => 'Santri Awal Dimerge',
            'kelas' => 'VIII-B',
        ]);

        $this->assertDatabaseHas('siswas', [
            'nis' => 'NIS200',
            'nama' => 'Santri Baru Kedua',
            'kelas' => 'VII-A',
        ]);

        // Verifikasi profil User siswa juga disinkronkan namanya
        $this->assertEquals('Santri Awal Dimerge', $userStudent->fresh()->name);
    }

    public function test_view_only_user_cannot_run_dry_run_or_apply_import(): void
    {
        $ustadz = User::factory()->create(['role' => 'Ustadz', 'status' => 'Aktif']);

        // Beri Ustadz izin view_only pada master_siswa
        RolePermission::updateOrCreate(
            ['role' => 'Ustadz', 'feature' => 'master_siswa'],
            ['access_level' => 'view', 'is_allowed' => true]
        );

        $file = UploadedFile::fake()->createWithContent('test.csv', "NIS,Nama,Kelas\nNIS001,Test,VII-A");

        // Coba Dry-Run (Ditolak 403)
        $this->actingAs($ustadz)->post(route('master.siswa.dry-run'), ['file' => $file])
            ->assertForbidden();

        // Coba Apply Import (Ditolak 403)
        $this->actingAs($ustadz)->postJson(route('master.siswa.apply-import'), [
            'items' => [['nis' => 'NIS001', 'nama' => 'Test', 'kelas' => 'VII-A']],
        ])->assertForbidden();
    }
}
