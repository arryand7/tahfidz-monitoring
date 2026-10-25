<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class UstadzController extends Controller
{
    // 1. Tampilkan Halaman
    public function index()
    {
        $ustadzs = Ustadz::orderBy('nama', 'asc')->get();

        return Inertia::render('DatabaseUstadz', ['ustadzs' => $ustadzs]);
    }

    // 2. Simpan Ustadz Baru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nip' => 'nullable|string|max:50|unique:ustadzs,nip',
            'nama' => 'required|string|max:100',
            'no_hp' => 'nullable|string|max:20',
            'status' => 'required|in:Aktif,Non-Aktif',
        ]);

        Ustadz::create($validated);

        return redirect()->back();
    }

    // 3. Update Data Ustadz
    public function update(Request $request, $id)
    {
        $ustadz = Ustadz::findOrFail($id);
        $validated = $request->validate([
            'nip' => 'nullable|string|max:50|unique:ustadzs,nip,'.$id,
            'nama' => 'required|string|max:100',
            'no_hp' => 'nullable|string|max:20',
            'status' => 'required|in:Aktif,Non-Aktif',
        ]);

        $ustadz->update($validated);

        return redirect()->back();
    }

    // 4. Hapus Data Ustadz
    public function destroy($id)
    {
        Ustadz::findOrFail($id)->delete();

        return redirect()->back();
    }

    // 5. Download Template CSV
    public function downloadTemplate()
    {
        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=Template_Upload_Ustadz.csv',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['NIP', 'Nama Lengkap', 'No HP']);
            fputcsv($file, ['19800101', 'Contoh Ust. Fulan', '081234567890']);
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    // 6. Import Data Massal CSV
    public function import(Request $request)
    {
        $request->validate(['file' => 'required|mimes:csv,txt|max:2048']);
        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $header = true;

        while ($row = fgetcsv($handle, 1000, ',')) {
            if ($header) {
                $header = false;

                continue;
            }
            if (isset($row[0]) && isset($row[1])) {
                Ustadz::updateOrCreate(
                    ['nip' => $row[0]],
                    [
                        'nama' => $row[1],
                        'no_hp' => $row[2] ?? null,
                        'status' => 'Aktif',
                    ]
                );
            }
        }
        fclose($handle);

        return redirect()->back();
    }

    // 7. Bulk Action (Ubah Status, Hapus Massal - Khusus Admin)
    public function bulkAction(Request $request)
    {
        if ($request->user()?->role !== 'Admin') {
            abort(403, 'Akses ditolak. Fitur aksi massal (bulk action) hanya dapat diakses oleh Admin.');
        }

        $validated = $request->validate([
            'action' => 'required|in:update_status,delete',
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:ustadzs,id',
            'status' => 'nullable|required_if:action,update_status|in:Aktif,Non-Aktif',
        ]);

        $ids = $validated['ids'];
        $count = count($ids);

        DB::transaction(function () use ($validated, $ids) {
            if ($validated['action'] === 'update_status') {
                Ustadz::whereIn('id', $ids)->update(['status' => $validated['status']]);
            } elseif ($validated['action'] === 'delete') {
                $ustadzs = Ustadz::whereIn('id', $ids)->get();
                $nipList = $ustadzs->pluck('nip')->filter()->toArray();

                if (! empty($nipList)) {
                    User::whereIn('username', $nipList)->where('role', 'Ustadz')->delete();
                }

                Ustadz::whereIn('id', $ids)->delete();
            }
        });

        $actionMessages = [
            'update_status' => "Berhasil memperbarui status untuk {$count} ustadz menjadi '{$request->input('status')}'.",
            'delete' => "Berhasil menghapus {$count} data ustadz terpilih.",
        ];

        $message = $actionMessages[$validated['action']] ?? 'Aksi massal berhasil diproses.';

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => $message]);
        }

        return redirect()->back()->with('success', $message);
    }
}
