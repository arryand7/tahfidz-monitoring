<?php

namespace App\Http\Controllers;

use App\Models\Setoran;
use App\Models\Siswa;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia; // Import library PDF

class RekapSiswaController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $isStudent = $user && $user->role === 'Siswa';
        $linkedSiswa = $isStudent ? $user->getLinkedSiswa() : null;

        $query = Siswa::withCount([
            'setorans as total_hafalan' => function ($query) {
                $query->where('jenis', 'Hafalan');
            },
            'setorans as total_murojaah' => function ($query) {
                $query->where('jenis', 'Murojaah');
            },
        ]);

        if ($isStudent) {
            $query->where('id', $linkedSiswa ? $linkedSiswa->id : 0);
        }

        $rekapSiswa = $query->orderBy('nama', 'asc')->get()->map(function ($siswa) {
            return [
                'id' => $siswa->id,
                'nis' => $siswa->nis,
                'nama' => $siswa->nama,
                'kelas' => $siswa->kelas,
                'status' => $siswa->status,
                'totalHafalan' => $siswa->total_hafalan,
                'totalMurojaah' => $siswa->total_murojaah,
            ];
        });

        return Inertia::render('RekapSiswa', [
            'rekapSiswaData' => $rekapSiswa,
            'isStudent' => $isStudent,
            'currentStudent' => $linkedSiswa,
        ]);
    }

    // --- FUNGSI EXPORT CSV (SATU SHEET PANJANG) ---
    public function exportCsvAll()
    {
        $user = auth()->user();
        $isStudent = $user && $user->role === 'Siswa';
        $linkedSiswa = $isStudent ? $user->getLinkedSiswa() : null;

        $query = Setoran::with(['siswa', 'ustadz'])->orderBy('siswa_id')->orderBy('tanggal', 'desc');

        if ($isStudent) {
            $query->where('siswa_id', $linkedSiswa ? $linkedSiswa->id : 0);
        }

        $setorans = $query->get();
        $filename = $isStudent ? 'Rekap_Setoran_'.($linkedSiswa?->nis ?? 'Siswa').'.csv' : 'Master_Rekap_Semua_Siswa.csv';

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($setorans) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['NIS', 'Nama Siswa', 'Kelas', 'Tanggal', 'Jenis', 'Surah', 'Ayat', 'Nilai', 'Pembimbing', 'Catatan']);

            foreach ($setorans as $row) {
                fputcsv($file, [
                    $row->siswa?->nis ?? '-', $row->siswa?->nama ?? '-', $row->siswa?->kelas ?? '-',
                    $row->tanggal, $row->jenis, $row->surah,
                    $row->ayat_awal.'-'.$row->ayat_akhir,
                    $row->nilai, $row->ustadz?->nama ?? '-', $row->catatan ?? '-',
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    // --- FUNGSI EXPORT PDF (TERPISAH HALAMAN PER SISWA) ---
    public function exportPdfAll()
    {
        $user = auth()->user();
        $isStudent = $user && $user->role === 'Siswa';
        $linkedSiswa = $isStudent ? $user->getLinkedSiswa() : null;

        $query = Siswa::whereHas('setorans')->with(['setorans' => function ($q) {
            $q->orderBy('tanggal', 'desc');
        }, 'setorans.ustadz']);

        if ($isStudent) {
            $query->where('id', $linkedSiswa ? $linkedSiswa->id : 0);
        }

        $siswas = $query->get();
        $filename = $isStudent ? 'Rekap_Lengkap_'.($linkedSiswa?->nis ?? 'Siswa').'.pdf' : 'Rekap_Lengkap_Setoran_Siswa.pdf';

        $pdf = Pdf::loadView('pdf.rekap_semua', compact('siswas'));

        return $pdf->stream($filename);
    }

    // --- FUNGSI EXPORT CSV (SATU SISWA) ---
    public function exportCsvSingle($id)
    {
        $user = auth()->user();
        if ($user && $user->role === 'Siswa') {
            $linkedSiswa = $user->getLinkedSiswa();
            if (! $linkedSiswa || $linkedSiswa->id != $id) {
                abort(403, 'Akses ditolak. Anda hanya berhak mengunduh rekap setoran data Anda sendiri.');
            }
        }

        $siswa = Siswa::findOrFail($id);
        $setorans = Setoran::with('ustadz')->where('siswa_id', $id)->orderBy('tanggal', 'desc')->get();

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=Rekap_Setoran_{$siswa->nis}_{$siswa->nama}.csv",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($setorans, $siswa) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['NIS', 'Nama Siswa', 'Kelas', 'Tanggal', 'Jenis', 'Surah', 'Ayat', 'Nilai', 'Pembimbing', 'Catatan']);

            foreach ($setorans as $row) {
                fputcsv($file, [
                    $siswa->nis, $siswa->nama, $siswa->kelas,
                    $row->tanggal, $row->jenis, $row->surah,
                    $row->ayat_awal.'-'.$row->ayat_akhir,
                    $row->nilai, $row->ustadz?->nama ?? '-', $row->catatan ?? '-',
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    // --- FUNGSI EXPORT PDF (SATU SISWA) ---
    public function exportPdfSingle($id)
    {
        $user = auth()->user();
        if ($user && $user->role === 'Siswa') {
            $linkedSiswa = $user->getLinkedSiswa();
            if (! $linkedSiswa || $linkedSiswa->id != $id) {
                abort(403, 'Akses ditolak. Anda hanya berhak mengunduh rekap setoran data Anda sendiri.');
            }
        }

        $siswa = Siswa::with(['setorans' => function ($query) {
            $query->orderBy('tanggal', 'desc');
        }, 'setorans.ustadz'])->findOrFail($id);

        $siswas = collect([$siswa]);
        $pdf = Pdf::loadView('pdf.rekap_semua', compact('siswas'));

        return $pdf->stream("Rekap_Setoran_{$siswa->nis}_{$siswa->nama}.pdf");
    }
}
