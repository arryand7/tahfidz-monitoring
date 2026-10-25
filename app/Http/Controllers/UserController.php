<?php

namespace App\Http\Controllers;

use App\Models\Siswa;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        // Tampilkan semua user kecuali yang sedang login (opsional, tapi bagus agar admin tidak terhapus sendiri)
        $users = User::orderBy('role', 'asc')->orderBy('name', 'asc')->get();

        return Inertia::render('KelolaUser', ['users' => $users]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users,username',
            'role' => 'required|in:Admin,Ustadz,Siswa',
            'status' => 'required|in:Aktif,Non-Aktif',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $validated['email'] = $validated['username'].'@sabira.local'; // Email palsu otomatis
        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:50|unique:users,username,'.$id,
            'role' => 'required|in:Admin,Ustadz,Siswa',
            'status' => 'required|in:Aktif,Non-Aktif',
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
        ]);

        $user->name = $validated['name'];
        $user->username = $validated['username'];
        $user->role = $validated['role'];
        $user->status = $validated['status'];

        // Update password hanya jika diisi
        if ($request->filled('password')) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return redirect()->back();
    }

    public function destroy($id)
    {
        User::findOrFail($id)->delete();

        return redirect()->back();
    }

    // Fungsi Sakti: Generate Akun Massal Otomatis
    public function generateAccounts()
    {
        if (function_exists('set_time_limit')) {
            @set_time_limit(300);
        }

        $defaultPasswordHash = Hash::make('sabira123');
        $existingUsers = User::whereNotNull('username')->pluck('username')->flip()->toArray();

        // 1. Generate Akun untuk Siswa
        $siswas = Siswa::all();
        foreach ($siswas as $siswa) {
            if (! isset($existingUsers[$siswa->nis])) {
                User::create([
                    'name' => $siswa->nama,
                    'username' => $siswa->nis,
                    'email' => $siswa->nis.'@sabira.local',
                    'role' => 'Siswa',
                    'status' => $siswa->status,
                    'password' => $defaultPasswordHash,
                ]);
                $existingUsers[$siswa->nis] = true;
            }
        }

        // 2. Generate Akun untuk Ustadz (Hanya yang punya NIP)
        $ustadzs = Ustadz::whereNotNull('nip')->get();
        foreach ($ustadzs as $ustadz) {
            if (! isset($existingUsers[$ustadz->nip])) {
                User::create([
                    'name' => $ustadz->nama,
                    'username' => $ustadz->nip,
                    'email' => $ustadz->nip.'@sabira.local',
                    'role' => 'Ustadz',
                    'status' => $ustadz->status,
                    'password' => $defaultPasswordHash,
                ]);
                $existingUsers[$ustadz->nip] = true;
            }
        }

        return redirect()->back();
    }

    // 6. Bulk Action Akun Pengguna (Ubah Peran, Ubah Status, Reset Password, Hapus - Khusus Admin)
    public function bulkAction(Request $request)
    {
        if ($request->user()?->role !== 'Admin') {
            abort(403, 'Akses ditolak. Fitur aksi massal (bulk action) hanya dapat diakses oleh Admin.');
        }

        $validated = $request->validate([
            'action' => 'required|in:update_role,update_status,reset_password,delete',
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:users,id',
            'role' => 'nullable|required_if:action,update_role|in:Admin,Ustadz,Siswa',
            'status' => 'nullable|required_if:action,update_status|in:Aktif,Non-Aktif',
        ]);

        $currentUserId = $request->user()->id;
        $ids = array_values(array_filter($validated['ids'], fn ($id) => (int) $id !== (int) $currentUserId));

        if (empty($ids) && in_array($validated['action'], ['delete', 'update_role', 'update_status'])) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menerapkan aksi massal ini pada akun Anda sendiri demi keamanan.',
            ], 422);
        }

        $count = count($ids);

        DB::transaction(function () use ($validated, $ids) {
            if ($validated['action'] === 'update_role') {
                User::whereIn('id', $ids)->update(['role' => $validated['role']]);
            } elseif ($validated['action'] === 'update_status') {
                User::whereIn('id', $ids)->update(['status' => $validated['status']]);
            } elseif ($validated['action'] === 'reset_password') {
                User::whereIn('id', $ids)->update(['password' => Hash::make('sabira123')]);
            } elseif ($validated['action'] === 'delete') {
                User::whereIn('id', $ids)->delete();
            }
        });

        $actionMessages = [
            'update_role' => "Berhasil memperbarui peran untuk {$count} akun menjadi '{$request->input('role')}'.",
            'update_status' => "Berhasil memperbarui status untuk {$count} akun menjadi '{$request->input('status')}'.",
            'reset_password' => "Berhasil mereset password untuk {$count} akun terpilih ke default 'sabira123'.",
            'delete' => "Berhasil menghapus {$count} akun pengguna terpilih.",
        ];

        $message = $actionMessages[$validated['action']] ?? 'Aksi massal berhasil diproses.';

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'message' => $message]);
        }

        return redirect()->back()->with('success', $message);
    }
}
