<?php

namespace App\Http\Controllers;

use App\Models\Siswa;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Http\Request;
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
        // 1. Generate Akun untuk Siswa
        $siswas = Siswa::all();
        foreach ($siswas as $siswa) {
            // firstOrCreate: Buat baru JIKA username (NIS) belum terdaftar di tabel users
            User::firstOrCreate(
                ['username' => $siswa->nis],
                [
                    'name' => $siswa->nama,
                    'email' => $siswa->nis.'@sabira.local',
                    'role' => 'Siswa',
                    'status' => $siswa->status,
                    'password' => Hash::make('sabira123'), // Password default
                ]
            );
        }

        // 2. Generate Akun untuk Ustadz (Hanya yang punya NIP)
        $ustadzs = Ustadz::whereNotNull('nip')->get();
        foreach ($ustadzs as $ustadz) {
            User::firstOrCreate(
                ['username' => $ustadz->nip],
                [
                    'name' => $ustadz->nama,
                    'email' => $ustadz->nip.'@sabira.local',
                    'role' => 'Ustadz',
                    'status' => $ustadz->status,
                    'password' => Hash::make('sabira123'), // Password default
                ]
            );
        }

        return redirect()->back();
    }
}
