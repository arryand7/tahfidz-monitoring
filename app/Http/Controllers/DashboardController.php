<?php

namespace App\Http\Controllers;

use App\Models\Setoran;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $hariIni = Carbon::today();

        // 1. Menghitung Statistik Hari Ini
        $totalSiswaSetoran = Setoran::whereDate('tanggal', $hariIni)->distinct('siswa_id')->count('siswa_id');
        $hafalanBaru = Setoran::whereDate('tanggal', $hariIni)->where('jenis', 'Hafalan')->distinct('siswa_id')->count('siswa_id');
        $murojaah = Setoran::whereDate('tanggal', $hariIni)->where('jenis', 'Murojaah')->distinct('siswa_id')->count('siswa_id');

        // 2. Mengambil 10 Log Setoran Terakhir Hari Ini
        // Menggunakan Eager Loading (with) untuk menarik data Ustadz dan Siswa sekaligus agar lebih cepat
        $recentLogs = Setoran::with(['ustadz', 'siswa'])
            ->whereDate('tanggal', $hariIni)
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($log) {
                // Memformat data agar sesuai dengan struktur props di React
                return [
                    'id' => $log->id,
                    'waktu' => $log->created_at ? $log->created_at->format('H:i') : '-',
                    'ustadz' => $log->ustadz?->nama ?? 'Ustadz Terhapus',
                    'siswa' => $log->siswa?->nama ?? 'Siswa Terhapus',
                    'jenis' => $log->jenis,
                    'detail' => $log->surah.' ('.$log->ayat_awal.'-'.$log->ayat_akhir.')',
                    'nilai' => $log->nilai,
                ];
            });

        // 3. Mengirim Data ke React (Inertia)
        return Inertia::render('Dashboard', [
            'stats' => [
                'totalSiswaSetoran' => $totalSiswaSetoran,
                'hafalanBaru' => $hafalanBaru,
                'murojaah' => $murojaah,
            ],
            'recentLogs' => $recentLogs,
        ]);
    }
}
