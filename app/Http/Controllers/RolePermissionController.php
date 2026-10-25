<?php

namespace App\Http\Controllers;

use App\Models\RolePermission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RolePermissionController extends Controller
{
    /**
     * Menampilkan halaman matriks hak akses.
     */
    public function index()
    {
        return Inertia::render('KelolaHakAkses', [
            'features' => RolePermission::features(),
            'matrix' => RolePermission::getMatrix(),
            'roles' => ['Admin', 'Ustadz', 'Siswa'],
        ]);
    }

    /**
     * Memperbarui matriks hak akses seluruh role.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'matrix' => 'required|array',
            'matrix.*' => 'array',
        ]);

        RolePermission::updateMatrix($validated['matrix']);

        return redirect()->back()->with('success', 'Matriks hak akses berhasil diperbarui!');
    }

    /**
     * Mengembalikan hak akses ke standar bawaan sistem.
     */
    public function reset()
    {
        RolePermission::resetToDefault();

        return redirect()->back()->with('success', 'Hak akses berhasil dikembalikan ke standar awal sistem!');
    }
}
