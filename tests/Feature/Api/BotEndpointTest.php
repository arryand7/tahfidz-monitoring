<?php

namespace Tests\Feature\Api;

use App\Models\Setoran;
use App\Models\Siswa;
use App\Models\Ustadz;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BotEndpointTest extends TestCase
{
    use RefreshDatabase;

    private string $secretKey = 'test-bot-secret-key-12345';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.wa_bot.secret_key' => $this->secretKey]);
    }

    private function botHeaders(): array
    {
        return ['X-Bot-Secret-Key' => $this->secretKey];
    }

    /* -------------------------------------------------------------- */
    /*  Auth / Middleware */
    /* -------------------------------------------------------------- */

    public function test_manifest_rejects_missing_secret(): void
    {
        $this->getJson('/api/bot/manifest')
            ->assertStatus(401)
            ->assertJsonFragment(['success' => false, 'error' => 'Unauthorized.']);
    }

    public function test_manifest_rejects_wrong_secret(): void
    {
        $this->getJson('/api/bot/manifest', ['X-Bot-Secret-Key' => 'wrong-secret'])
            ->assertStatus(401)
            ->assertJsonFragment(['success' => false, 'error' => 'Unauthorized.']);
    }

    public function test_query_rejects_missing_secret(): void
    {
        $this->postJson('/api/bot/query', ['action' => 'daily_report'])
            ->assertStatus(401)
            ->assertJsonFragment(['success' => false]);
    }

    /* -------------------------------------------------------------- */
    /*  GET /api/bot/manifest */
    /* -------------------------------------------------------------- */

    public function test_manifest_returns_all_actions(): void
    {
        $response = $this->getJson('/api/bot/manifest', $this->botHeaders())
            ->assertOk()
            ->assertJsonStructure([
                'app',
                'version',
                'actions' => [
                    '*' => ['id', 'name', 'description', 'parameters', 'variables'],
                ],
            ]);

        $data = $response->json();
        $this->assertEquals('tahfidz-monitoring', $data['app']);
        $this->assertEquals('1.0', $data['version']);
        $this->assertCount(4, $data['actions']);

        $actionIds = collect($data['actions'])->pluck('id')->all();
        $this->assertContains('daily_report', $actionIds);
        $this->assertContains('unsubmitted_only', $actionIds);
        $this->assertContains('check_student', $actionIds);
        $this->assertContains('top_achievers', $actionIds);

        $checkAction = collect($data['actions'])->firstWhere('id', 'check_student');
        $this->assertNotNull($checkAction);
        $this->assertNotEmpty($checkAction['parameters']);
        $this->assertEquals('query', $checkAction['parameters'][0]['name']);
        $this->assertTrue($checkAction['parameters'][0]['required']);
    }

    public function test_direct_action_route_works(): void
    {
        $response = $this->postJson('/api/bot/unsubmitted_only', [], $this->botHeaders())
            ->assertOk()
            ->assertJsonFragment(['action' => 'unsubmitted_only', 'success' => true]);

        $this->assertArrayHasKey('jumlah_belum_setor_hari_ini', $response->json('data'));
    }

    /* -------------------------------------------------------------- */
    /*  POST /api/bot/query — unsupported action */
    /* -------------------------------------------------------------- */

    public function test_query_rejects_unsupported_action(): void
    {
        $this->postJson('/api/bot/query', [
            'action' => 'unknown_action',
            'params' => [],
        ], $this->botHeaders())
            ->assertStatus(422)
            ->assertJsonFragment(['success' => false])
            ->assertJsonStructure(['supported_actions']);
    }

    /* -------------------------------------------------------------- */
    /*  POST /api/bot/query — daily_report */
    /* -------------------------------------------------------------- */

    public function test_daily_report_returns_all_variables(): void
    {
        $ustadz = Ustadz::create([
            'nama' => 'Ustadz Abdullah',
            'status' => 'Aktif',
            'nip' => 'UST-001',
        ]);

        $siswa1 = Siswa::create([
            'nama' => 'Ahmad Santri',
            'nis' => '1001',
            'kelas' => '7A',
            'status' => 'Aktif',
        ]);

        $siswa2 = Siswa::create([
            'nama' => 'Budi Pratama',
            'nis' => '1002',
            'kelas' => '7A',
            'status' => 'Aktif',
        ]);

        $siswa3 = Siswa::create([
            'nama' => 'Citra Dewi',
            'nis' => '1003',
            'kelas' => '7B',
            'status' => 'Aktif',
        ]);

        // Siswa non aktif (tidak dihitung dalam active students)
        Siswa::create([
            'nama' => 'Doni Nonaktif',
            'nis' => '1004',
            'kelas' => '7B',
            'status' => 'Non-Aktif',
        ]);

        $today = Carbon::now('Asia/Jakarta')->toDateString();

        // Setoran siswa1 hari ini
        Setoran::create([
            'ustadz_id' => $ustadz->id,
            'siswa_id' => $siswa1->id,
            'tanggal' => $today,
            'jenis' => 'Hafalan',
            'surah' => 'An-Naba',
            'ayat_awal' => '1',
            'ayat_akhir' => '15',
            'nilai' => 'Baik',
            'catatan' => 'Tajwid lancar',
        ]);

        $response = $this->postJson('/api/bot/query', [
            'action' => 'daily_report',
            'params' => [],
        ], $this->botHeaders())
            ->assertOk()
            ->assertJsonFragment(['success' => true, 'action' => 'daily_report']);

        $data = $response->json('data');

        $expectedKeys = [
            'tanggal',
            'total_siswa',
            'jumlah_sudah_setor_hari_ini',
            'jumlah_belum_setor_hari_ini',
            'persentase_setoran_hari_ini',
            'ringkasan_setoran_hari_ini',
            'rekap_per_halaqah',
            'daftar_belum_setor',
        ];

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $data, "Missing key: {$key}");
            $this->assertIsString($data[$key], "Value for {$key} must be string");
        }

        $this->assertEquals('3', $data['total_siswa']);
        $this->assertEquals('1', $data['jumlah_sudah_setor_hari_ini']);
        $this->assertEquals('2', $data['jumlah_belum_setor_hari_ini']);
        $this->assertEquals('33%', $data['persentase_setoran_hari_ini']);
        $this->assertStringContainsString('Budi Pratama', $data['daftar_belum_setor']);
        $this->assertStringContainsString('Citra Dewi', $data['daftar_belum_setor']);
        $this->assertStringNotContainsString('Ahmad Santri', $data['daftar_belum_setor']);
    }

    public function test_daily_report_handles_empty_data(): void
    {
        $response = $this->postJson('/api/bot/query', [
            'action' => 'daily_report',
        ], $this->botHeaders())
            ->assertOk();

        $data = $response->json('data');
        $this->assertEquals('0', $data['total_siswa']);
        $this->assertEquals('0', $data['jumlah_sudah_setor_hari_ini']);
        $this->assertEquals('0', $data['jumlah_belum_setor_hari_ini']);
        $this->assertEquals('0%', $data['persentase_setoran_hari_ini']);
    }

    /* -------------------------------------------------------------- */
    /*  POST /api/bot/query — unsubmitted_only */
    /* -------------------------------------------------------------- */

    public function test_unsubmitted_only_returns_correct_data(): void
    {
        $ustadz = Ustadz::create([
            'nama' => 'Ustadz Umar',
            'status' => 'Aktif',
            'nip' => 'UST-002',
        ]);

        $siswa1 = Siswa::create([
            'nama' => 'Fulan',
            'nis' => '2001',
            'kelas' => '8A',
            'status' => 'Aktif',
        ]);

        $siswa2 = Siswa::create([
            'nama' => 'Fulanah',
            'nis' => '2002',
            'kelas' => '8A',
            'status' => 'Aktif',
        ]);

        $today = Carbon::now('Asia/Jakarta')->toDateString();

        Setoran::create([
            'ustadz_id' => $ustadz->id,
            'siswa_id' => $siswa1->id,
            'tanggal' => $today,
            'jenis' => 'Murojaah',
            'surah' => 'Al-Mulk',
            'ayat_awal' => '1',
            'ayat_akhir' => '30',
            'nilai' => 'Baik',
        ]);

        $response = $this->postJson('/api/bot/query', [
            'action' => 'unsubmitted_only',
        ], $this->botHeaders())
            ->assertOk()
            ->assertJsonFragment(['action' => 'unsubmitted_only', 'success' => true]);

        $data = $response->json('data');
        $this->assertEquals('1', $data['jumlah_belum_setor_hari_ini']);
        $this->assertStringContainsString('Fulanah', $data['daftar_belum_setor']);
        $this->assertStringNotContainsString('Fulan (NIS', $data['daftar_belum_setor']);
    }

    /* -------------------------------------------------------------- */
    /*  POST /api/bot/query — check_student */
    /* -------------------------------------------------------------- */

    public function test_check_student_requires_query_param(): void
    {
        $this->postJson('/api/bot/query', [
            'action' => 'check_student',
            'params' => [],
        ], $this->botHeaders())
            ->assertStatus(422)
            ->assertJsonFragment(['success' => false, 'error' => 'Missing required parameter: query']);
    }

    public function test_check_student_returns_not_found(): void
    {
        $response = $this->postJson('/api/bot/query', [
            'action' => 'check_student',
            'params' => ['query' => 'SantriGaib999'],
        ], $this->botHeaders())
            ->assertOk();

        $this->assertStringContainsString('Tidak ditemukan santri', $response->json('data.hasil_pencarian_siswa'));
    }

    public function test_check_student_finds_by_name_and_nis(): void
    {
        $ustadz = Ustadz::create([
            'nama' => 'Ustadz Hasan',
            'status' => 'Aktif',
            'nip' => 'UST-003',
        ]);

        $siswa = Siswa::create([
            'nama' => 'Zaid bin Tsabit',
            'nis' => '3001',
            'kelas' => '9B',
            'status' => 'Aktif',
        ]);

        Setoran::create([
            'ustadz_id' => $ustadz->id,
            'siswa_id' => $siswa->id,
            'tanggal' => Carbon::now('Asia/Jakarta')->subDay()->toDateString(),
            'jenis' => 'Hafalan',
            'surah' => 'Al-Baqarah',
            'ayat_awal' => '1',
            'ayat_akhir' => '20',
            'nilai' => 'Baik',
            'catatan' => 'Makharijul huruf sangat fasih',
        ]);

        // Cari by name
        $response1 = $this->postJson('/api/bot/query', [
            'action' => 'check_student',
            'params' => ['query' => 'Zaid'],
        ], $this->botHeaders())
            ->assertOk();

        $hasil1 = $response1->json('data.hasil_pencarian_siswa');
        $this->assertStringContainsString('Zaid bin Tsabit', $hasil1);
        $this->assertStringContainsString('NIS: 3001', $hasil1);
        $this->assertStringContainsString('Kelas: 9B', $hasil1);
        $this->assertStringContainsString('Al-Baqarah', $hasil1);
        $this->assertStringContainsString('Ustadz Hasan', $hasil1);

        // Cari by NIS
        $response2 = $this->postJson('/api/bot/query', [
            'action' => 'check_student',
            'params' => ['query' => '3001'],
        ], $this->botHeaders())
            ->assertOk();

        $this->assertStringContainsString('Zaid bin Tsabit', $response2->json('data.hasil_pencarian_siswa'));
    }

    /* -------------------------------------------------------------- */
    /*  POST /api/bot/query — top_achievers */
    /* -------------------------------------------------------------- */

    public function test_top_achievers_returns_correct_data(): void
    {
        $ustadz = Ustadz::create(['nama' => 'Ustadz Ali', 'nip' => 'UST-004']);

        $siswa1 = Siswa::create(['nama' => 'Santri Rajin', 'nis' => '4001', 'kelas' => '8A', 'status' => 'Aktif']);
        $siswa2 = Siswa::create(['nama' => 'Santri Sedang', 'nis' => '4002', 'kelas' => '8A', 'status' => 'Aktif']);

        // Siswa 1 punya 3 setoran
        for ($i = 1; $i <= 3; $i++) {
            Setoran::create([
                'ustadz_id' => $ustadz->id,
                'siswa_id' => $siswa1->id,
                'tanggal' => Carbon::now('Asia/Jakarta')->subDays($i)->toDateString(),
                'jenis' => 'Hafalan',
                'surah' => 'An-Nazi\'at',
                'ayat_awal' => '1',
                'ayat_akhir' => '10',
                'nilai' => 'Baik',
            ]);
        }

        // Siswa 2 punya 1 setoran
        Setoran::create([
            'ustadz_id' => $ustadz->id,
            'siswa_id' => $siswa2->id,
            'tanggal' => Carbon::now('Asia/Jakarta')->toDateString(),
            'jenis' => 'Murojaah',
            'surah' => 'An-Naba',
            'ayat_awal' => '1',
            'ayat_akhir' => '40',
            'nilai' => 'Baik',
        ]);

        $response = $this->postJson('/api/bot/query', [
            'action' => 'top_achievers',
        ], $this->botHeaders())
            ->assertOk()
            ->assertJsonFragment(['action' => 'top_achievers', 'success' => true]);

        $data = $response->json('data');
        $this->assertArrayHasKey('tanggal', $data);
        $this->assertArrayHasKey('daftar_capaian_terbaik', $data);
        $this->assertIsString($data['daftar_capaian_terbaik']);
        $this->assertStringContainsString('Santri Rajin', $data['daftar_capaian_terbaik']);
        $this->assertStringContainsString('Santri Sedang', $data['daftar_capaian_terbaik']);
    }

    public function test_top_achievers_handles_empty_data(): void
    {
        $response = $this->postJson('/api/bot/query', [
            'action' => 'top_achievers',
        ], $this->botHeaders())
            ->assertOk();

        $data = $response->json('data');
        $this->assertStringContainsString('Belum ada data capaian', $data['daftar_capaian_terbaik']);
    }
}
