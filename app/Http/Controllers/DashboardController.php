<?php

namespace App\Http\Controllers;

use App\Models\Setoran;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $isStudent = $user && $user->role === 'Siswa';
        $linkedSiswa = $isStudent ? $user->getLinkedSiswa() : null;

        if ($isStudent) {
            $siswaId = $linkedSiswa?->id ?? 0;

            // Statistik personal siswa
            $totalSetoran = Setoran::where('siswa_id', $siswaId)->count();
            $hafalanBaru = Setoran::where('siswa_id', $siswaId)->where('jenis', 'Hafalan')->count();
            $murojaah = Setoran::where('siswa_id', $siswaId)->where('jenis', 'Murojaah')->count();
            $setoranTerakhir = Setoran::where('siswa_id', $siswaId)->latest()->first();

            $recentLogs = Setoran::with(['ustadz', 'siswa'])
                ->where('siswa_id', $siswaId)
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'waktu' => $log->created_at ? $log->created_at->format('H:i') : '-',
                        'tanggal' => $log->tanggal ? Carbon::parse($log->tanggal)->format('d M Y') : '-',
                        'ustadz' => $log->ustadz?->nama ?? 'Ustadz Terhapus',
                        'siswa' => $log->siswa?->nama ?? 'Siswa Terhapus',
                        'jenis' => $log->jenis,
                        'detail' => $log->surah.' ('.$log->ayat_awal.'-'.$log->ayat_akhir.')',
                        'nilai' => $log->nilai,
                        'catatan' => $log->catatan ?? '-',
                    ];
                });

            return Inertia::render('Dashboard', [
                'isStudent' => true,
                'studentProfile' => $linkedSiswa ? [
                    'id' => $linkedSiswa->id,
                    'nis' => $linkedSiswa->nis,
                    'nama' => $linkedSiswa->nama,
                    'kelas' => $linkedSiswa->kelas,
                ] : null,
                'stats' => [
                    'totalSiswaSetoran' => $totalSetoran,
                    'hafalanBaru' => $hafalanBaru,
                    'murojaah' => $murojaah,
                    'lastSurah' => $setoranTerakhir ? $setoranTerakhir->surah.' : '.$setoranTerakhir->ayat_awal.'-'.$setoranTerakhir->ayat_akhir : '-',
                ],
                'recentLogs' => $recentLogs,
            ]);
        }

        $hariIni = Carbon::today();

        // 1. Menghitung Statistik Global Hari Ini (Admin & Ustadz)
        $totalSiswaSetoran = Setoran::whereDate('tanggal', $hariIni)->distinct('siswa_id')->count('siswa_id');
        $hafalanBaru = Setoran::whereDate('tanggal', $hariIni)->where('jenis', 'Hafalan')->distinct('siswa_id')->count('siswa_id');
        $murojaah = Setoran::whereDate('tanggal', $hariIni)->where('jenis', 'Murojaah')->distinct('siswa_id')->count('siswa_id');

        // 2. Mengambil 10 Log Setoran Terakhir Hari Ini
        $recentLogs = Setoran::with(['ustadz', 'siswa'])
            ->whereDate('tanggal', $hariIni)
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'waktu' => $log->created_at ? $log->created_at->format('H:i') : '-',
                    'tanggal' => $log->tanggal ? Carbon::parse($log->tanggal)->format('d M Y') : '-',
                    'ustadz' => $log->ustadz?->nama ?? 'Ustadz Terhapus',
                    'siswa' => $log->siswa?->nama ?? 'Siswa Terhapus',
                    'jenis' => $log->jenis,
                    'detail' => $log->surah.' ('.$log->ayat_awal.'-'.$log->ayat_akhir.')',
                    'nilai' => $log->nilai,
                    'catatan' => $log->catatan ?? '-',
                ];
            });

        // 3. Mengirim Data ke React (Inertia)
        return Inertia::render('Dashboard', [
            'isStudent' => false,
            'stats' => [
                'totalSiswaSetoran' => $totalSiswaSetoran,
                'hafalanBaru' => $hafalanBaru,
                'murojaah' => $murojaah,
            ],
            'recentLogs' => $recentLogs,
        ]);
    }
}
