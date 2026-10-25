<?php

namespace App\Http\Controllers;

use App\Models\MasterQuran;
use App\Models\Setoran;
use App\Models\Siswa;
use App\Models\Ustadz;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SetoranController extends Controller
{
    // Menampilkan halaman form dengan data dinamis
    public function create()
    {
        return Inertia::render('InputSetoran', [
            // Hanya kirim siswa yang statusnya Aktif
            'siswas' => Siswa::where('status', 'Aktif')->orderBy('nama', 'asc')->get(),
            // Kirim semua data 114 Surah
            'masterQuran' => MasterQuran::orderBy('id', 'asc')->get(),
        ]);
    }

    // Menerima dan menyimpan data dari React ke Database
    public function store(Request $request)
    {
        $validated = $request->validate([
            'siswa_id' => 'required|exists:siswas,id',
            'jenis' => 'required|in:Hafalan,Murojaah',
            'surah' => 'required|string', // Kita simpan nama surahnya
            'ayat_awal' => 'required|string',
            'ayat_akhir' => 'required|string',
            'nilai' => 'required|in:Baik,Cukup,Kurang',
            'catatan' => 'nullable|string',
        ]);

        // Ambil ustadz dari user yang sedang login atau fallback ke ustadz pertama
        $user = auth()->user();
        $ustadzId = null;
        if ($user && $user->role === 'Ustadz' && $user->username) {
            $ustadz = Ustadz::where('nip', $user->username)->first();
            if ($ustadz) {
                $ustadzId = $ustadz->id;
            }
        }
        if (! $ustadzId) {
            $firstUstadz = Ustadz::first();
            $ustadzId = $firstUstadz ? $firstUstadz->id : 1;
        }

        $validated['ustadz_id'] = $ustadzId;
        $validated['tanggal'] = Carbon::today()->format('Y-m-d');

        // Simpan ke database
        Setoran::create($validated);

        // Redirect ke Dashboard setelah sukses menyimpan
        return redirect()->route('dashboard');
    }
}
