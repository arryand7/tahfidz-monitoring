<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setoran;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class BotController extends Controller
{
    /* ------------------------------------------------------------------ */
    /*  GET /api/bot/manifest */
    /* ------------------------------------------------------------------ */

    public function manifest(): JsonResponse
    {
        return response()->json([
            'app' => 'tahfidz-monitoring',
            'version' => '1.0',
            'actions' => [
                [
                    'id' => 'daily_report',
                    'name' => 'Laporan Harian Monitoring Tahfidz',
                    'description' => 'Rangkuman progres kehadiran setoran hafalan dan murojaah seluruh santri hari ini.',
                    'parameters' => [],
                    'variables' => [
                        'tanggal',
                        'total_siswa',
                        'jumlah_sudah_setor_hari_ini',
                        'jumlah_belum_setor_hari_ini',
                        'persentase_setoran_hari_ini',
                        'ringkasan_setoran_hari_ini',
                        'rekap_per_halaqah',
                        'daftar_belum_setor',
                    ],
                ],
                [
                    'id' => 'unsubmitted_only',
                    'name' => 'Daftar Siswa Belum Setor Hari Ini',
                    'description' => 'Daftar santri aktif yang belum menyetorkan hafalan hari ini dikelompokkan per kelas/halaqah.',
                    'parameters' => [],
                    'variables' => [
                        'tanggal',
                        'jumlah_belum_setor_hari_ini',
                        'daftar_belum_setor',
                    ],
                ],
                [
                    'id' => 'check_student',
                    'name' => 'Cek Progres Hafalan Siswa',
                    'description' => 'Mencari data detail capaian dan riwayat setoran siswa berdasarkan nama atau NIS.',
                    'parameters' => [
                        [
                            'name' => 'query',
                            'description' => 'Nama / NIS Siswa',
                            'required' => true,
                        ],
                    ],
                    'variables' => [
                        'query',
                        'hasil_pencarian_siswa',
                    ],
                ],
                [
                    'id' => 'top_achievers',
                    'name' => 'Rekap Capaian Hafalan Terbaik',
                    'description' => 'Daftar santri dengan setoran paling aktif dan capaian hafalan tertinggi.',
                    'parameters' => [],
                    'variables' => [
                        'tanggal',
                        'daftar_capaian_terbaik',
                    ],
                ],
            ],
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  POST /api/bot/query and POST /api/bot/{action} */
    /* ------------------------------------------------------------------ */

    public function handleAction(Request $request, string $action): JsonResponse
    {
        return $this->executeAction($action, $request->all());
    }

    public function query(Request $request): JsonResponse
    {
        $action = $request->input('action');
        $params = (array) $request->input('params', $request->except('action'));

        return $this->executeAction($action, $params);
    }

    public function executeAction(?string $action, array $params = []): JsonResponse
    {
        return match ($action) {
            'daily_report' => $this->dailyReport(),
            'unsubmitted_only' => $this->unsubmittedOnly(),
            'check_student' => $this->checkStudent($params),
            'top_achievers' => $this->topAchievers(),
            default => response()->json([
                'success' => false,
                'error' => "Action \"{$action}\" is not supported.",
                'supported_actions' => ['daily_report', 'unsubmitted_only', 'check_student', 'top_achievers'],
            ], 422),
        };
    }

    /* ------------------------------------------------------------------ */
    /*  Action Handlers */
    /* ------------------------------------------------------------------ */

    private function dailyReport(): JsonResponse
    {
        $now = Carbon::now('Asia/Jakarta');
        $todayDate = $now->toDateString();

        $activeStudents = Siswa::where('status', 'Aktif')->orderBy('kelas')->orderBy('nama')->get();
        $totalSiswa = $activeStudents->count();

        $todaySetorans = Setoran::whereDate('tanggal', $todayDate)
            ->with(['siswa', 'ustadz'])
            ->get();

        $submittedStudentIds = $todaySetorans->pluck('siswa_id')->unique()->filter()->values()->all();
        $jumlahSudahSetor = $activeStudents->whereIn('id', $submittedStudentIds)->count();
        $unsubmittedStudents = $activeStudents->whereNotIn('id', $submittedStudentIds);
        $jumlahBelumSetor = $unsubmittedStudents->count();

        $persentase = $totalSiswa > 0 ? round(($jumlahSudahSetor / $totalSiswa) * 100).'%' : '0%';
        $ringkasan = $this->buildTodaySummary($todaySetorans);
        $rekapPerHalaqah = $this->buildClassSummary($activeStudents, $submittedStudentIds);
        $daftarBelumSetor = $this->buildUnsubmittedList($unsubmittedStudents);

        return response()->json([
            'success' => true,
            'action' => 'daily_report',
            'data' => [
                'tanggal' => $now->translatedFormat('l, d F Y'),
                'total_siswa' => (string) $totalSiswa,
                'jumlah_sudah_setor_hari_ini' => (string) $jumlahSudahSetor,
                'jumlah_belum_setor_hari_ini' => (string) $jumlahBelumSetor,
                'persentase_setoran_hari_ini' => (string) $persentase,
                'ringkasan_setoran_hari_ini' => (string) $ringkasan,
                'rekap_per_halaqah' => (string) $rekapPerHalaqah,
                'daftar_belum_setor' => (string) $daftarBelumSetor,
            ],
        ]);
    }

    private function unsubmittedOnly(): JsonResponse
    {
        $now = Carbon::now('Asia/Jakarta');
        $todayDate = $now->toDateString();

        $activeStudents = Siswa::where('status', 'Aktif')->orderBy('kelas')->orderBy('nama')->get();
        $todaySetoranStudentIds = Setoran::whereDate('tanggal', $todayDate)
            ->pluck('siswa_id')
            ->unique()
            ->filter()
            ->values()
            ->all();

        $unsubmittedStudents = $activeStudents->whereNotIn('id', $todaySetoranStudentIds);
        $jumlahBelumSetor = $unsubmittedStudents->count();
        $daftarBelumSetor = $this->buildUnsubmittedList($unsubmittedStudents);

        return response()->json([
            'success' => true,
            'action' => 'unsubmitted_only',
            'data' => [
                'tanggal' => $now->translatedFormat('l, d F Y'),
                'jumlah_belum_setor_hari_ini' => (string) $jumlahBelumSetor,
                'daftar_belum_setor' => (string) $daftarBelumSetor,
            ],
        ]);
    }

    private function checkStudent(array $params): JsonResponse
    {
        $query = trim($params['query'] ?? '');

        if ($query === '') {
            return response()->json([
                'success' => false,
                'error' => 'Missing required parameter: query',
            ], 422);
        }

        $students = Siswa::where(function ($q) use ($query) {
            $q->where('nama', 'like', "%{$query}%")
                ->orWhere('nis', 'like', "%{$query}%");
        })
            ->with([
                'setorans' => fn ($q) => $q->with('ustadz')->orderBy('tanggal', 'desc')->orderBy('id', 'desc'),
            ])
            ->limit(10)
            ->get();

        if ($students->isEmpty()) {
            $hasil = "Tidak ditemukan santri dengan pencarian: {$query}";
        } else {
            $lines = [];
            foreach ($students as $student) {
                $statusBadge = $student->status === 'Aktif' ? 'Aktif' : 'Non-Aktif';
                $lines[] = "📋 {$student->nama}";
                $lines[] = "NIS: {$student->nis} | Kelas: {$student->kelas} | Status: {$statusBadge}";

                $setorans = $student->setorans;
                $totalSetoran = $setorans->count();

                if ($totalSetoran === 0) {
                    $lines[] = 'Riwayat Setoran: Belum pernah melakukan setoran.';
                } else {
                    $hafalanCount = $setorans->where('jenis', 'Hafalan')->count();
                    $murojaahCount = $setorans->where('jenis', 'Murojaah')->count();
                    $lines[] = "Total Setoran: {$totalSetoran} kali ({$hafalanCount} Hafalan Baru, {$murojaahCount} Murojaah)";

                    $last = $setorans->first();
                    $tgl = Carbon::parse($last->tanggal)->translatedFormat('d F Y');
                    $ustadzName = $last->ustadz?->nama ?? 'Tidak diketahui';

                    $lines[] = "Setoran Terakhir: {$tgl}";
                    $lines[] = "Materi: {$last->jenis} — Surah {$last->surah} (Ayat {$last->ayat_awal} s/d {$last->ayat_akhir})";
                    $lines[] = "Nilai: {$last->nilai} (Pembimbing: Ustadz {$ustadzName})";
                    if (! empty($last->catatan)) {
                        $lines[] = "Catatan: {$last->catatan}";
                    }
                }

                $lines[] = ''; // Blank line separator
            }

            $hasil = rtrim(implode("\n", $lines));
        }

        return response()->json([
            'success' => true,
            'action' => 'check_student',
            'data' => [
                'query' => (string) $query,
                'hasil_pencarian_siswa' => (string) $hasil,
            ],
        ]);
    }

    private function topAchievers(): JsonResponse
    {
        $now = Carbon::now('Asia/Jakarta');

        $topStudents = Siswa::where('status', 'Aktif')
            ->has('setorans')
            ->withCount([
                'setorans as total_setoran',
                'setorans as total_hafalan' => fn ($q) => $q->where('jenis', 'Hafalan'),
                'setorans as total_murojaah' => fn ($q) => $q->where('jenis', 'Murojaah'),
            ])
            ->with(['setorans' => fn ($q) => $q->orderBy('tanggal', 'desc')->orderBy('id', 'desc')->limit(1)])
            ->orderByDesc('total_setoran')
            ->orderByDesc('total_hafalan')
            ->limit(10)
            ->get();

        if ($topStudents->isEmpty()) {
            $daftar = 'Belum ada data capaian setoran yang tercatat.';
        } else {
            $lines = ["🏆 10 SANTRI DENGAN CAPAIAN SETORAN TERTINGGI:\n"];
            foreach ($topStudents->values() as $i => $s) {
                $rank = $i + 1;
                $lastSetoran = $s->setorans->first();
                $lastDetail = $lastSetoran
                    ? " | Terakhir: Surah {$lastSetoran->surah} ({$lastSetoran->ayat_awal}-{$lastSetoran->ayat_akhir})"
                    : '';

                $lines[] = "{$rank}. {$s->nama} ({$s->kelas}) — {$s->total_setoran}x setoran ({$s->total_hafalan} Hafalan, {$s->total_murojaah} Murojaah){$lastDetail}";
            }
            $daftar = implode("\n", $lines);
        }

        return response()->json([
            'success' => true,
            'action' => 'top_achievers',
            'data' => [
                'tanggal' => $now->translatedFormat('l, d F Y'),
                'daftar_capaian_terbaik' => (string) $daftar,
            ],
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  Shared Helpers */
    /* ------------------------------------------------------------------ */

    private function buildTodaySummary(Collection $todaySetorans): string
    {
        if ($todaySetorans->isEmpty()) {
            return 'Belum ada catatan setoran masuk hari ini.';
        }

        $total = $todaySetorans->count();
        $hafalan = $todaySetorans->where('jenis', 'Hafalan')->count();
        $murojaah = $todaySetorans->where('jenis', 'Murojaah')->count();

        $baik = $todaySetorans->where('nilai', 'Baik')->count();
        $cukup = $todaySetorans->where('nilai', 'Cukup')->count();
        $kurang = $todaySetorans->where('nilai', 'Kurang')->count();

        $summary = "Total: {$total} setoran tercatat ({$hafalan} Hafalan Baru, {$murojaah} Murojaah)";
        $summary .= "\nKualitas Nilai: {$baik} Baik, {$cukup} Cukup, {$kurang} Kurang";

        return $summary;
    }

    private function buildClassSummary(Collection $activeStudents, array $submittedStudentIds): string
    {
        if ($activeStudents->isEmpty()) {
            return 'Tidak ada data santri aktif.';
        }

        $byClass = $activeStudents->groupBy(fn ($s) => $s->kelas ?: 'Tanpa Kelas');
        $lines = [];

        foreach ($byClass as $kelas => $students) {
            $kTotal = $students->count();
            $kSudah = $students->whereIn('id', $submittedStudentIds)->count();
            $kPct = $kTotal > 0 ? round(($kSudah / $kTotal) * 100) : 0;

            $lines[] = "• {$kelas}: {$kSudah}/{$kTotal} santri ({$kPct}%)";
        }

        return implode("\n", $lines);
    }

    private function buildUnsubmittedList(Collection $unsubmittedStudents): string
    {
        if ($unsubmittedStudents->isEmpty()) {
            return 'Alhamdulillah, seluruh santri aktif telah menyetorkan hafalan hari ini 🎉';
        }

        $byClass = $unsubmittedStudents->groupBy(fn ($s) => $s->kelas ?: 'Tanpa Kelas');
        $lines = [];

        foreach ($byClass as $kelas => $students) {
            $lines[] = "📂 Kelas {$kelas}:";
            foreach ($students->values() as $i => $s) {
                $no = $i + 1;
                $lines[] = "  {$no}. {$s->nama} (NIS: {$s->nis})";
            }
        }

        return implode("\n", $lines);
    }
}
