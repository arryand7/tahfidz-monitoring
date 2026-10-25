<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Kosongkan tabel sebelum diisi agar tidak duplikat jika dijalankan ulang (kompatibel SQLite & MySQL)
        Schema::disableForeignKeyConstraints();
        DB::table('setorans')->truncate();
        DB::table('siswas')->truncate();
        DB::table('ustadzs')->truncate();
        Schema::enableForeignKeyConstraints();

        // 2. Suntik Data Ustadz
        $ustadzs = [
            ['nip' => '19800101', 'nama' => 'Ust. Abdul Somad', 'no_hp' => '081234567890', 'created_at' => now(), 'updated_at' => now()],
            ['nip' => '19820202', 'nama' => 'Ust. Adi Hidayat', 'no_hp' => '081298765432', 'created_at' => now(), 'updated_at' => now()],
            ['nip' => '19850303', 'nama' => 'Ust. Hanan Attaki', 'no_hp' => '081311223344', 'created_at' => now(), 'updated_at' => now()],
        ];
        DB::table('ustadzs')->insert($ustadzs);

        // 3. Suntik Data Siswa
        $siswas = [
            ['nis' => '2023001', 'nama' => 'Ahmad Muzakki', 'kelas' => 'X-IPA 1', 'created_at' => now(), 'updated_at' => now()],
            ['nis' => '2023002', 'nama' => 'Budi Santoso', 'kelas' => 'X-IPA 2', 'created_at' => now(), 'updated_at' => now()],
            ['nis' => '2023003', 'nama' => 'Candra Wijaya', 'kelas' => 'X-IPS 1', 'created_at' => now(), 'updated_at' => now()],
            ['nis' => '2023004', 'nama' => 'Deni Setiawan', 'kelas' => 'XI-IPA 1', 'created_at' => now(), 'updated_at' => now()],
            ['nis' => '2023005', 'nama' => 'Eko Prasetyo', 'kelas' => 'XI-IPS 2', 'created_at' => now(), 'updated_at' => now()],
        ];
        DB::table('siswas')->insert($siswas);

        // 4. Suntik Data Setoran (Simulasi Aktivitas Hari Ini)
        $setorans = [];
        $surahList = ['Al-Baqarah', 'Ali Imran', 'An-Nisa', 'An-Naba', 'An-Naziat', 'Abasa'];
        $nilaiList = ['Baik', 'Cukup', 'Kurang'];
        $jenisList = ['Hafalan', 'Murojaah'];

        // Buat 15 baris log setoran acak
        for ($i = 1; $i <= 15; $i++) {
            $setorans[] = [
                'ustadz_id' => rand(1, 3), // Pilih ID ustadz 1-3 acak
                'siswa_id' => rand(1, 5),  // Pilih ID siswa 1-5 acak
                'tanggal' => Carbon::today()->format('Y-m-d'), // Semua setoran dianggap hari ini
                'jenis' => $jenisList[array_rand($jenisList)],
                'surah' => $surahList[array_rand($surahList)],
                'ayat_awal' => (string) rand(1, 10),
                'ayat_akhir' => (string) rand(11, 50),
                'nilai' => $nilaiList[array_rand($nilaiList)],
                'catatan' => 'Catatan otomatis dari Seeder ke-'.$i,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('setorans')->insert($setorans);
    }
}
