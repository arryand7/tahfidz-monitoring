<?php

namespace App\Http\Controllers;

use App\Models\Setoran;
use App\Models\Siswa;
use Carbon\Carbon;
use Inertia\Inertia;

class RekapSetoranController extends Controller
{
    public function index()
    {
        // 1. Ambil data siswa untuk dropdown filter
        $siswas = Siswa::select('id', 'nis', 'nama', 'kelas')->orderBy('nama')->get();

        // 2. Ambil semua riwayat setoran beserta relasi Ustadz & Siswa
        $semuaRiwayat = Setoran::with(['siswa', 'ustadz'])
            ->latest() // Urutkan dari yang paling baru
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'siswaId' => $log->siswa_id,
                    'namaSiswa' => $log->siswa?->nama ?? 'Siswa Terhapus',
                    'tanggal' => Carbon::parse($log->tanggal)->format('d M Y'),
                    'ustadz' => $log->ustadz?->nama ?? 'Ustadz Terhapus',
                    'jenis' => $log->jenis,
                    'surah' => $log->surah,
                    'ayat' => $log->ayat_awal.'-'.$log->ayat_akhir,
                    'nilai' => $log->nilai,
                    'catatan' => $log->catatan ?? '-',
                ];
            });

        return Inertia::render('RekapSetoran', [
            'siswas' => $siswas,
            'semuaRiwayat' => $semuaRiwayat,
        ]);
    }
}
