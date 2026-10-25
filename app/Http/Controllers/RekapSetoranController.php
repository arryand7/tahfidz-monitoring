<?php

namespace App\Http\Controllers;

use App\Models\Setoran;
use App\Models\Siswa;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RekapSetoranController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $isStudent = $user && $user->role === 'Siswa';
        $linkedSiswa = $isStudent ? $user->getLinkedSiswa() : null;

        if ($isStudent) {
            $siswaId = $linkedSiswa ? $linkedSiswa->id : 0;
            $siswas = $linkedSiswa ? collect([$linkedSiswa]) : collect();

            $semuaRiwayat = Setoran::with(['siswa', 'ustadz'])
                ->where('siswa_id', $siswaId)
                ->latest()
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'siswaId' => $log->siswa_id,
                        'namaSiswa' => $log->siswa?->nama ?? 'Siswa Terhapus',
                        'nis' => $log->siswa?->nis ?? '-',
                        'kelas' => $log->siswa?->kelas ?? '-',
                        'tanggal' => Carbon::parse($log->tanggal)->format('d M Y'),
                        'rawTanggal' => $log->tanggal,
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
                'isStudent' => true,
                'currentStudent' => $linkedSiswa,
            ]);
        }

        // 1. Ambil data siswa untuk dropdown filter
        $siswas = Siswa::select('id', 'nis', 'nama', 'kelas')->orderBy('nama')->get();

        // 2. Ambil semua riwayat setoran beserta relasi Ustadz & Siswa
        $semuaRiwayat = Setoran::with(['siswa', 'ustadz'])
            ->latest()
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'siswaId' => $log->siswa_id,
                    'namaSiswa' => $log->siswa?->nama ?? 'Siswa Terhapus',
                    'nis' => $log->siswa?->nis ?? '-',
                    'kelas' => $log->siswa?->kelas ?? '-',
                    'tanggal' => Carbon::parse($log->tanggal)->format('d M Y'),
                    'rawTanggal' => $log->tanggal,
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
            'isStudent' => false,
            'currentStudent' => null,
        ]);
    }

    // Hapus single setoran (Khusus Admin)
    public function destroy($id)
    {
        if (auth()->user()?->role !== 'Admin') {
            abort(403, 'Akses ditolak. Hanya Admin yang dapat menghapus riwayat setoran.');
        }

        Setoran::findOrFail($id)->delete();

        return redirect()->back()->with('success', 'Riwayat setoran berhasil dihapus.');
    }

    // Bulk Action Hapus Setoran (Khusus Admin)
    public function bulkAction(Request $request)
    {
        if ($request->user()?->role !== 'Admin') {
            abort(403, 'Akses ditolak. Fitur aksi massal hanya dapat diakses oleh Admin.');
        }

        $validated = $request->validate([
            'action' => 'required|in:delete',
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:setorans,id',
        ]);

        $ids = $validated['ids'];
        $count = count($ids);

        Setoran::whereIn('id', $ids)->delete();

        $message = "Berhasil menghapus {$count} catatan riwayat setoran terpilih.";

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => $message]);
        }

        return redirect()->back()->with('success', $message);
    }
}
