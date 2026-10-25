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
        $rekapSiswa = Siswa::withCount([
            'setorans as total_hafalan' => function ($query) {
                $query->where('jenis', 'Hafalan');
            },
            'setorans as total_murojaah' => function ($query) {
                $query->where('jenis', 'Murojaah');
            },
        ])->orderBy('nama', 'asc')->get()->map(function ($siswa) {
            return [
                'id' => $siswa->id, 'nis' => $siswa->nis, 'nama' => $siswa->nama,
                'kelas' => $siswa->kelas, 'totalHafalan' => $siswa->total_hafalan, 'totalMurojaah' => $siswa->total_murojaah,
            ];
        });

        return Inertia::render('RekapSiswa', ['rekapSiswaData' => $rekapSiswa]);
    }

    // --- FUNGSI EXPORT CSV (SATU SHEET PANJANG) ---
    public function exportCsvAll()
    {
        $setorans = Setoran::with(['siswa', 'ustadz'])->orderBy('siswa_id')->orderBy('tanggal', 'desc')->get();

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=Master_Rekap_Semua_Siswa.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($setorans) {
            $file = fopen('php://output', 'w');
            // Header Kolom CSV
            fputcsv($file, ['NIS', 'Nama Siswa', 'Kelas', 'Tanggal', 'Jenis', 'Surah', 'Ayat', 'Nilai', 'Pembimbing', 'Catatan']);

            // Isi Baris CSV
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
        // Ambil data siswa yang memiliki setoran, beserta relasinya
        $siswas = Siswa::whereHas('setorans')->with(['setorans' => function ($query) {
            $query->orderBy('tanggal', 'desc');
        }, 'setorans.ustadz'])->get();

        // Render ke View Blade lalu jadikan PDF
        $pdf = Pdf::loadView('pdf.rekap_semua', compact('siswas'));

        // Download file
        return $pdf->stream('Rekap_Lengkap_Setoran_Siswa.pdf');
    }

    // --- FUNGSI EXPORT CSV (SATU SISWA) ---
    public function exportCsvSingle($id)
    {
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
        $siswa = Siswa::with(['setorans' => function ($query) {
            $query->orderBy('tanggal', 'desc');
        }, 'setorans.ustadz'])->findOrFail($id);

        // Trik cerdas: Bungkus 1 siswa ini ke dalam Collection agar bisa didaur ulang
        // oleh file Blade 'rekap_semua' yang menggunakan @foreach($siswas as $siswa)
        $siswas = collect([$siswa]);

        $pdf = Pdf::loadView('pdf.rekap_semua', compact('siswas'));

        return $pdf->stream("Rekap_Setoran_{$siswa->nis}_{$siswa->nama}.pdf");
    }
}
