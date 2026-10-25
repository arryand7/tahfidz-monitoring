<?php

namespace App\Http\Controllers;

use App\Models\Siswa;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SiswaController extends Controller
{
    // 1. Menampilkan Halaman dengan Data Asli
    public function index()
    {
        // Ambil semua data siswa, urutkan berdasarkan NIS
        $siswas = Siswa::orderBy('nis', 'asc')->get();

        return Inertia::render('DatabaseSiswa', [
            'siswas' => $siswas,
        ]);
    }

    // 2. Fungsi Download Template CSV
    public function downloadTemplate()
    {
        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=Template_Upload_Siswa.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            // Header baris pertama (wajib sama dengan kebutuhan database)
            fputcsv($file, ['NIS', 'Nama Lengkap', 'Kelas']);
            // Baris kedua: Contoh cara pengisian agar admin tidak bingung
            fputcsv($file, ['2026001', 'Contoh Nama Siswa', 'X-IPA 1']);
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    // 3. Fungsi Menyimpan Data Siswa Baru (Input Manual)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nis' => 'required|string|max:20|unique:siswas,nis',
            'nama' => 'required|string|max:100',
            'kelas' => 'required|string|max:50',
            'status' => 'required|in:Aktif,Non-Aktif',
        ]);

        Siswa::create($validated);

        // Kembali ke halaman sebelumnya secara otomatis (Inertia akan me-refresh data tabel)
        return redirect()->back();
    }

    // 4. Fungsi Upload / Import Data Massal (CSV)
    public function import(Request $request)
    {
        // Validasi pastikan file yang diupload adalah CSV
        $request->validate([
            'file' => 'required|mimes:csv,txt|max:2048',
        ]);

        $file = $request->file('file');

        // Buka file CSV
        $handle = fopen($file->getPathname(), 'r');
        $header = true;

        // Baca baris demi baris
        while ($row = fgetcsv($handle, 1000, ',')) {
            // Lewati baris pertama (karena itu adalah judul kolom: NIS, Nama, Kelas)
            if ($header) {
                $header = false;

                continue;
            }

            // Pastikan baris memiliki 3 kolom (NIS, Nama, Kelas)
            if (isset($row[0]) && isset($row[1]) && isset($row[2])) {
                // updateOrCreate: Jika NIS sudah ada, update datanya. Jika belum, buat baru.
                Siswa::updateOrCreate(
                    ['nis' => $row[0]],
                    [
                        'nama' => $row[1],
                        'kelas' => $row[2],
                        'status' => 'Aktif',
                    ]
                );
            }
        }
        fclose($handle);

        // Kembali ke halaman (Inertia akan otomatis me-refresh tabel)
        return redirect()->back();
    }

    // 5. Fungsi Update Data Siswa (Edit)
    public function update(Request $request, $id)
    {
        $siswa = Siswa::findOrFail($id);

        $validated = $request->validate([
            // Validasi unik kecuali untuk ID siswa yang sedang diedit
            'nis' => 'required|string|max:20|unique:siswas,nis,'.$id,
            'nama' => 'required|string|max:100',
            'kelas' => 'required|string|max:50',
            'status' => 'required|in:Aktif,Non-Aktif',
        ]);

        $siswa->update($validated);

        return redirect()->back();
    }

    // 6. Fungsi Hapus Data Siswa (Delete)
    public function destroy($id)
    {
        // Karena relasi di tabel setoran memakai onDelete('cascade'),
        // menghapus siswa otomatis akan menghapus riwayat setorannya.
        Siswa::findOrFail($id)->delete();

        return redirect()->back();
    }
}
