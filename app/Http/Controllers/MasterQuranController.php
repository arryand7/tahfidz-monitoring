<?php

namespace App\Http\Controllers;

use App\Models\MasterQuran;
use Inertia\Inertia;

class MasterQuranController extends Controller
{
    public function index()
    {
        // Ambil semua data 114 Surah, urutkan berdasarkan ID (Nomor Surah)
        $quran = MasterQuran::orderBy('id', 'asc')->get();

        return Inertia::render('MasterQuran', [
            'quranList' => $quran,
        ]);
    }
}
