<?php

namespace Database\Seeders;

use App\Models\Siswa;
use App\Models\User;
use App\Models\Ustadz;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Master Data Al-Quran (114 Surah)
        $this->call([
            MasterQuranSeeder::class,
            DummyDataSeeder::class,
        ]);

        // 2. Buat Akun Admin Utama
        User::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Administrator Sabira',
                'email' => 'admin@sabira.local',
                'password' => Hash::make('admin123'),
                'role' => 'Admin',
                'status' => 'Aktif',
            ]
        );

        // 3. Generate Akun User untuk Ustadz dari data dummy
        $ustadzs = Ustadz::whereNotNull('nip')->get();
        foreach ($ustadzs as $ustadz) {
            User::firstOrCreate(
                ['username' => $ustadz->nip],
                [
                    'name' => $ustadz->nama,
                    'email' => $ustadz->nip.'@sabira.local',
                    'role' => 'Ustadz',
                    'status' => $ustadz->status,
                    'password' => Hash::make('sabira123'),
                ]
            );
        }

        // 4. Generate Akun User untuk Siswa dari data dummy
        $siswas = Siswa::all();
        foreach ($siswas as $siswa) {
            User::firstOrCreate(
                ['username' => $siswa->nis],
                [
                    'name' => $siswa->nama,
                    'email' => $siswa->nis.'@sabira.local',
                    'role' => 'Siswa',
                    'status' => $siswa->status,
                    'password' => Hash::make('sabira123'),
                ]
            );
        }
    }
}
