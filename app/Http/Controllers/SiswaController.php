<?php

namespace App\Http\Controllers;

use App\Models\Siswa;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'Content-type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename=Template_Import_Siswa.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            // Write UTF-8 BOM for Microsoft Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Header kolom
            fputcsv($file, ['NIS', 'Nama Lengkap', 'Kelas', 'Status']);

            // Contoh data pengisian
            fputcsv($file, ['2026001', 'Ahmad Fauzi', 'VII-A', 'Aktif']);
            fputcsv($file, ['2026002', 'Budi Pratama', 'VII-B', 'Aktif']);
            fputcsv($file, ['2026003', 'Citra Dewi', 'VIII-A', 'Aktif']);

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

    // 4. Fitur Dry Run Import & Merger Siswa
    public function dryRun(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120', // max 5MB
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        if (! in_array($extension, ['csv', 'txt'])) {
            return response()->json([
                'success' => false,
                'message' => 'Format file tidak didukung. Harap unggah file berformat .csv atau .txt.',
            ], 422);
        }

        $rows = $this->parseCsvRows($file);
        if (empty($rows)) {
            return response()->json([
                'success' => false,
                'message' => 'File CSV kosong atau tidak memiliki baris data yang valid.',
            ], 422);
        }

        $existingSiswas = Siswa::all()->keyBy('nis');
        $items = [];
        $summary = [
            'total' => count($rows),
            'new' => 0,
            'update' => 0,
            'same' => 0,
            'invalid' => 0,
        ];

        // Lacak NIS yang sudah muncul dalam file untuk mendeteksi duplikat
        $seenNis = [];

        foreach ($rows as $index => $row) {
            $nis = trim($row['nis']);
            $nama = trim($row['nama']);
            $kelas = trim($row['kelas']);
            $status = $row['status'] ?? 'Aktif';

            // Validasi baris wajib isi NIS & Nama
            if ($nis === '' || $nama === '') {
                $summary['invalid']++;
                $items[] = [
                    'id' => $index + 1,
                    'row_number' => $row['row_number'],
                    'nis' => $nis ?: '(Kosong)',
                    'nama' => $nama ?: '(Kosong)',
                    'kelas' => $kelas,
                    'status' => $status,
                    'action' => 'invalid',
                    'error' => 'NIS dan Nama Santri wajib diisi.',
                    'existing' => null,
                    'changes' => null,
                ];

                continue;
            }

            if (isset($seenNis[$nis])) {
                $summary['invalid']++;
                $items[] = [
                    'id' => $index + 1,
                    'row_number' => $row['row_number'],
                    'nis' => $nis,
                    'nama' => $nama,
                    'kelas' => $kelas,
                    'status' => $status,
                    'action' => 'invalid',
                    'error' => "Duplikat NIS dalam file: NIS {$nis} sudah terdaftar pada baris {$seenNis[$nis]}.",
                    'existing' => null,
                    'changes' => null,
                ];

                continue;
            }
            $seenNis[$nis] = $row['row_number'];

            $existing = $existingSiswas->get($nis);

            if (! $existing) {
                // Santri Baru
                $summary['new']++;
                $items[] = [
                    'id' => $index + 1,
                    'row_number' => $row['row_number'],
                    'nis' => $nis,
                    'nama' => $nama,
                    'kelas' => $kelas,
                    'status' => $status,
                    'action' => 'new',
                    'error' => null,
                    'existing' => null,
                    'changes' => null,
                ];
            } else {
                // Santri Lama -> Cek perubahan data untuk rekonsiliasi / merger
                $diffs = [];
                if ($existing->nama !== $nama) {
                    $diffs['nama'] = [
                        'old' => $existing->nama,
                        'new' => $nama,
                    ];
                }
                if ($existing->kelas !== $kelas) {
                    $diffs['kelas'] = [
                        'old' => $existing->kelas,
                        'new' => $kelas,
                    ];
                }
                if ($existing->status !== $status) {
                    $diffs['status'] = [
                        'old' => $existing->status,
                        'new' => $status,
                    ];
                }

                if (! empty($diffs)) {
                    $summary['update']++;
                    $items[] = [
                        'id' => $index + 1,
                        'row_number' => $row['row_number'],
                        'nis' => $nis,
                        'nama' => $nama,
                        'kelas' => $kelas,
                        'status' => $status,
                        'action' => 'update',
                        'error' => null,
                        'existing' => [
                            'nama' => $existing->nama,
                            'kelas' => $existing->kelas,
                            'status' => $existing->status,
                        ],
                        'changes' => $diffs,
                    ];
                } else {
                    $summary['same']++;
                    $items[] = [
                        'id' => $index + 1,
                        'row_number' => $row['row_number'],
                        'nis' => $nis,
                        'nama' => $nama,
                        'kelas' => $kelas,
                        'status' => $status,
                        'action' => 'same',
                        'error' => null,
                        'existing' => [
                            'nama' => $existing->nama,
                            'kelas' => $existing->kelas,
                            'status' => $existing->status,
                        ],
                        'changes' => null,
                    ];
                }
            }
        }

        return response()->json([
            'success' => true,
            'filename' => $file->getClientOriginalName(),
            'summary' => $summary,
            'items' => $items,
        ]);
    }

    // 5. Eksekusi / Terapkan Import & Merger Santri Terpilih
    public function applyImport(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.nis' => 'required|string|max:20',
            'items.*.nama' => 'required|string|max:100',
            'items.*.kelas' => 'nullable|string|max:50',
            'items.*.status' => 'nullable|string|in:Aktif,Non-Aktif',
        ]);

        $createdCount = 0;
        $updatedCount = 0;

        DB::transaction(function () use ($validated, &$createdCount, &$updatedCount) {
            foreach ($validated['items'] as $item) {
                $nis = trim($item['nis']);
                $nama = trim($item['nama']);
                $kelas = trim($item['kelas'] ?? '-') ?: '-';
                $status = $item['status'] ?? 'Aktif';

                $existing = Siswa::where('nis', $nis)->first();

                if (! $existing) {
                    Siswa::create([
                        'nis' => $nis,
                        'nama' => $nama,
                        'kelas' => $kelas,
                        'status' => $status,
                    ]);
                    $createdCount++;
                } else {
                    $existing->update([
                        'nama' => $nama,
                        'kelas' => $kelas,
                        'status' => $status,
                    ]);
                    $updatedCount++;
                }

                // Sinkronkan nama profil user jika akun santri sudah terdaftar di users
                User::where('username', $nis)
                    ->where('role', 'Siswa')
                    ->update(['name' => $nama]);
            }
        });

        $message = "Berhasil memproses import: {$createdCount} santri baru ditambahkan, {$updatedCount} santri diperbarui / dimerge.";

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => $message,
                'created_count' => $createdCount,
                'updated_count' => $updatedCount,
            ]);
        }

        return redirect()->back()->with('success', $message);
    }

    // Helper: Parsing baris CSV dengan fleksibilitas delimiter (koma, titik koma, tab) & BOM
    private function parseCsvRows($file): array
    {
        $content = file_get_contents($file->getPathname());
        if (! $content) {
            return [];
        }

        // Hapus UTF-8 BOM jika ada
        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            $content = substr($content, 3);
        }

        $lines = preg_split('/\r\n|\r|\n/', trim($content));
        if (empty($lines)) {
            return [];
        }

        // Deteksi delimiter (koma, titik koma, atau tab)
        $firstLine = $lines[0];
        $delimiter = ',';
        $semicolonCount = substr_count($firstLine, ';');
        $commaCount = substr_count($firstLine, ',');
        $tabCount = substr_count($firstLine, "\t");

        if ($semicolonCount > $commaCount && $semicolonCount > $tabCount) {
            $delimiter = ';';
        } elseif ($tabCount > $commaCount && $tabCount > $semicolonCount) {
            $delimiter = "\t";
        }

        $rows = [];
        $headerMap = [];
        $isHeader = true;

        foreach ($lines as $lineIndex => $line) {
            if (trim($line) === '') {
                continue;
            }

            $cols = str_getcsv($line, $delimiter);
            $cols = array_map('trim', $cols);

            if ($isHeader) {
                $isHeader = false;
                foreach ($cols as $idx => $col) {
                    $cleanCol = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $col));
                    if (in_array($cleanCol, ['nis', 'noinduk', 'nomorinduk', 'id'])) {
                        $headerMap['nis'] = $idx;
                    } elseif (in_array($cleanCol, ['nama', 'namalengkap', 'namasiswa', 'name'])) {
                        $headerMap['nama'] = $idx;
                    } elseif (in_array($cleanCol, ['kelas', 'class', 'rombel'])) {
                        $headerMap['kelas'] = $idx;
                    } elseif (in_array($cleanCol, ['status', 'statusaktif'])) {
                        $headerMap['status'] = $idx;
                    }
                }

                // Fallback jika nama kolom tidak standar
                if (! isset($headerMap['nis'])) {
                    $headerMap['nis'] = 0;
                }
                if (! isset($headerMap['nama'])) {
                    $headerMap['nama'] = 1;
                }
                if (! isset($headerMap['kelas'])) {
                    $headerMap['kelas'] = 2;
                }
                if (! isset($headerMap['status'])) {
                    $headerMap['status'] = 3;
                }

                continue;
            }

            $nis = isset($headerMap['nis']) && isset($cols[$headerMap['nis']]) ? $cols[$headerMap['nis']] : '';
            $nama = isset($headerMap['nama']) && isset($cols[$headerMap['nama']]) ? $cols[$headerMap['nama']] : '';
            $kelas = isset($headerMap['kelas']) && isset($cols[$headerMap['kelas']]) ? $cols[$headerMap['kelas']] : '';
            $status = isset($headerMap['status']) && isset($cols[$headerMap['status']]) ? $cols[$headerMap['status']] : 'Aktif';

            // Bersihkan kutipan ekstra
            $nis = trim($nis, " \t\n\r\0\x0B\"'");
            $nama = trim($nama, " \t\n\r\0\x0B\"'");
            $kelas = trim($kelas, " \t\n\r\0\x0B\"'");
            $status = trim($status, " \t\n\r\0\x0B\"'");

            if ($nis === '' && $nama === '') {
                continue;
            }

            $normalizedStatus = in_array(strtolower($status), ['non-aktif', 'non aktif', 'tidak aktif', 'inactive', 'alumni', 'keluar']) ? 'Non-Aktif' : 'Aktif';

            $rows[] = [
                'row_number' => $lineIndex + 1,
                'nis' => (string) $nis,
                'nama' => (string) $nama,
                'kelas' => (string) ($kelas ?: '-'),
                'status' => $normalizedStatus,
            ];
        }

        return $rows;
    }

    // 6. Fungsi Upload / Import Data Massal (Legacy / Direct CSV)
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:csv,txt|max:5120',
        ]);

        $file = $request->file('file');
        $rows = $this->parseCsvRows($file);

        $created = 0;
        $updated = 0;

        foreach ($rows as $row) {
            if ($row['nis'] !== '' && $row['nama'] !== '') {
                $existing = Siswa::where('nis', $row['nis'])->first();
                if ($existing) {
                    $existing->update([
                        'nama' => $row['nama'],
                        'kelas' => $row['kelas'],
                        'status' => $row['status'],
                    ]);
                    $updated++;
                } else {
                    Siswa::create([
                        'nis' => $row['nis'],
                        'nama' => $row['nama'],
                        'kelas' => $row['kelas'],
                        'status' => $row['status'],
                    ]);
                    $created++;
                }

                User::where('username', $row['nis'])
                    ->where('role', 'Siswa')
                    ->update(['name' => $row['nama']]);
            }
        }

        return redirect()->back()->with('success', "Berhasil mengimpor data: {$created} santri baru, {$updated} santri diperbarui.");
    }

    // 7. Fungsi Update Data Siswa (Edit Manual)
    public function update(Request $request, $id)
    {
        $siswa = Siswa::findOrFail($id);

        $validated = $request->validate([
            'nis' => 'required|string|max:20|unique:siswas,nis,'.$id,
            'nama' => 'required|string|max:100',
            'kelas' => 'required|string|max:50',
            'status' => 'required|in:Aktif,Non-Aktif',
        ]);

        $siswa->update($validated);

        return redirect()->back();
    }

    // 8. Fungsi Hapus Data Siswa (Delete)
    public function destroy($id)
    {
        Siswa::findOrFail($id)->delete();

        return redirect()->back();
    }

    // 9. Fungsi Bulk Action (Aksi Massal: Ubah Kelas, Ubah Status, Hapus Massal - Khusus Admin)
    public function bulkAction(Request $request)
    {
        if ($request->user()?->role !== 'Admin') {
            abort(403, 'Akses ditolak. Fitur aksi massal (bulk action) hanya dapat diakses oleh Admin.');
        }

        $validated = $request->validate([
            'action' => 'required|in:update_kelas,update_status,delete',
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:siswas,id',
            'kelas' => 'nullable|required_if:action,update_kelas|string|max:50',
            'status' => 'nullable|required_if:action,update_status|in:Aktif,Non-Aktif',
        ]);

        $ids = $validated['ids'];
        $count = count($ids);

        DB::transaction(function () use ($validated, $ids) {
            if ($validated['action'] === 'update_kelas') {
                Siswa::whereIn('id', $ids)->update(['kelas' => $validated['kelas']]);
            } elseif ($validated['action'] === 'update_status') {
                Siswa::whereIn('id', $ids)->update(['status' => $validated['status']]);
            } elseif ($validated['action'] === 'delete') {
                $siswas = Siswa::whereIn('id', $ids)->get();
                $nisList = $siswas->pluck('nis')->filter()->toArray();

                if (! empty($nisList)) {
                    User::whereIn('username', $nisList)->where('role', 'Siswa')->delete();
                }

                Siswa::whereIn('id', $ids)->delete();
            }
        });

        $actionMessages = [
            'update_kelas' => "Berhasil memperbarui kelas untuk {$count} santri ke kelas '{$request->input('kelas')}'.",
            'update_status' => "Berhasil memperbarui status untuk {$count} santri menjadi '{$request->input('status')}'.",
            'delete' => "Berhasil menghapus {$count} data santri terpilih beserta riwayat setorannya.",
        ];

        $message = $actionMessages[$validated['action']] ?? 'Aksi massal berhasil diproses.';

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => $message]);
        }

        return redirect()->back()->with('success', $message);
    }
}
