<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MasterQuranSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::table('master_qurans')->truncate();
        Schema::enableForeignKeyConstraints();

        // Data 114 Surah Al-Quran
        $quranData = [
            ['nama_surah' => 'Al-Fatihah', 'arti' => 'Pembukaan', 'jumlah_ayat' => 7, 'posisi_juz' => 'Juz 1'],
            ['nama_surah' => 'Al-Baqarah', 'arti' => 'Sapi Betina', 'jumlah_ayat' => 286, 'posisi_juz' => 'Juz 1 - 3'],
            ['nama_surah' => 'Ali \'Imran', 'arti' => 'Keluarga \'Imran', 'jumlah_ayat' => 200, 'posisi_juz' => 'Juz 3 - 4'],
            ['nama_surah' => 'An-Nisa\'', 'arti' => 'Wanita', 'jumlah_ayat' => 176, 'posisi_juz' => 'Juz 4 - 6'],
            ['nama_surah' => 'Al-Ma\'idah', 'arti' => 'Jamuan', 'jumlah_ayat' => 120, 'posisi_juz' => 'Juz 6 - 7'],
            ['nama_surah' => 'Al-An\'am', 'arti' => 'Hewan Ternak', 'jumlah_ayat' => 165, 'posisi_juz' => 'Juz 7 - 8'],
            ['nama_surah' => 'Al-A\'raf', 'arti' => 'Tempat yang Tertinggi', 'jumlah_ayat' => 206, 'posisi_juz' => 'Juz 8 - 9'],
            ['nama_surah' => 'Al-Anfal', 'arti' => 'Harta Rampasan Perang', 'jumlah_ayat' => 75, 'posisi_juz' => 'Juz 9 - 10'],
            ['nama_surah' => 'At-Taubah', 'arti' => 'Pengampunan', 'jumlah_ayat' => 129, 'posisi_juz' => 'Juz 10 - 11'],
            ['nama_surah' => 'Yunus', 'arti' => 'Nabi Yunus', 'jumlah_ayat' => 109, 'posisi_juz' => 'Juz 11'],
            ['nama_surah' => 'Hud', 'arti' => 'Nabi Hud', 'jumlah_ayat' => 123, 'posisi_juz' => 'Juz 11 - 12'],
            ['nama_surah' => 'Yusuf', 'arti' => 'Nabi Yusuf', 'jumlah_ayat' => 111, 'posisi_juz' => 'Juz 12 - 13'],
            ['nama_surah' => 'Ar-Ra\'d', 'arti' => 'Guruh', 'jumlah_ayat' => 43, 'posisi_juz' => 'Juz 13'],
            ['nama_surah' => 'Ibrahim', 'arti' => 'Nabi Ibrahim', 'jumlah_ayat' => 52, 'posisi_juz' => 'Juz 13'],
            ['nama_surah' => 'Al-Hijr', 'arti' => 'Al Hijr', 'jumlah_ayat' => 99, 'posisi_juz' => 'Juz 14'],
            ['nama_surah' => 'An-Nahl', 'arti' => 'Lebah', 'jumlah_ayat' => 128, 'posisi_juz' => 'Juz 14'],
            ['nama_surah' => 'Al-Isra\'', 'arti' => 'Memperjalankan di Malam Hari', 'jumlah_ayat' => 111, 'posisi_juz' => 'Juz 15'],
            ['nama_surah' => 'Al-Kahf', 'arti' => 'Gua', 'jumlah_ayat' => 110, 'posisi_juz' => 'Juz 15 - 16'],
            ['nama_surah' => 'Maryam', 'arti' => 'Maryam', 'jumlah_ayat' => 98, 'posisi_juz' => 'Juz 16'],
            ['nama_surah' => 'Ta Ha', 'arti' => 'Ta Ha', 'jumlah_ayat' => 135, 'posisi_juz' => 'Juz 16'],
            ['nama_surah' => 'Al-Anbiya', 'arti' => 'Nabi-Nabi', 'jumlah_ayat' => 112, 'posisi_juz' => 'Juz 17'],
            ['nama_surah' => 'Al-Hajj', 'arti' => 'Haji', 'jumlah_ayat' => 78, 'posisi_juz' => 'Juz 17'],
            ['nama_surah' => 'Al-Mu\'minun', 'arti' => 'Orang-orang Mukmin', 'jumlah_ayat' => 118, 'posisi_juz' => 'Juz 18'],
            ['nama_surah' => 'An-Nur', 'arti' => 'Cahaya', 'jumlah_ayat' => 64, 'posisi_juz' => 'Juz 18'],
            ['nama_surah' => 'Al-Furqan', 'arti' => 'Pembeda', 'jumlah_ayat' => 77, 'posisi_juz' => 'Juz 18 - 19'],
            ['nama_surah' => 'Asy-Syu\'ara\'', 'arti' => 'Penyair', 'jumlah_ayat' => 227, 'posisi_juz' => 'Juz 19'],
            ['nama_surah' => 'An-Naml', 'arti' => 'Semut', 'jumlah_ayat' => 93, 'posisi_juz' => 'Juz 19 - 20'],
            ['nama_surah' => 'Al-Qasas', 'arti' => 'Kisah-kisah', 'jumlah_ayat' => 88, 'posisi_juz' => 'Juz 20'],
            ['nama_surah' => 'Al-\'Ankabut', 'arti' => 'Laba-laba', 'jumlah_ayat' => 69, 'posisi_juz' => 'Juz 20 - 21'],
            ['nama_surah' => 'Ar-Rum', 'arti' => 'Bangsa Romawi', 'jumlah_ayat' => 60, 'posisi_juz' => 'Juz 21'],
            ['nama_surah' => 'Luqman', 'arti' => 'Keluarga Luqman', 'jumlah_ayat' => 34, 'posisi_juz' => 'Juz 21'],
            ['nama_surah' => 'As-Sajdah', 'arti' => 'Sajdah', 'jumlah_ayat' => 30, 'posisi_juz' => 'Juz 21'],
            ['nama_surah' => 'Al-Ahzab', 'arti' => 'Golongan-golongan yang Bersekutu', 'jumlah_ayat' => 73, 'posisi_juz' => 'Juz 21 - 22'],
            ['nama_surah' => 'Saba\'', 'arti' => 'Kaum Saba\'', 'jumlah_ayat' => 54, 'posisi_juz' => 'Juz 22'],
            ['nama_surah' => 'Fatir', 'arti' => 'Pencipta', 'jumlah_ayat' => 45, 'posisi_juz' => 'Juz 22'],
            ['nama_surah' => 'Ya Sin', 'arti' => 'Ya Sin', 'jumlah_ayat' => 83, 'posisi_juz' => 'Juz 22 - 23'],
            ['nama_surah' => 'As-Saffat', 'arti' => 'Barisan-barisan', 'jumlah_ayat' => 182, 'posisi_juz' => 'Juz 23'],
            ['nama_surah' => 'Sad', 'arti' => 'Sad', 'jumlah_ayat' => 88, 'posisi_juz' => 'Juz 23'],
            ['nama_surah' => 'Az-Zumar', 'arti' => 'Rombongan-rombongan', 'jumlah_ayat' => 75, 'posisi_juz' => 'Juz 23 - 24'],
            ['nama_surah' => 'Gafir', 'arti' => 'Yang Mengampuni', 'jumlah_ayat' => 85, 'posisi_juz' => 'Juz 24'],
            ['nama_surah' => 'Fussilat', 'arti' => 'Yang Dijelaskan', 'jumlah_ayat' => 54, 'posisi_juz' => 'Juz 24 - 25'],
            ['nama_surah' => 'Asy-Syura', 'arti' => 'Musyawarah', 'jumlah_ayat' => 53, 'posisi_juz' => 'Juz 25'],
            ['nama_surah' => 'Az-Zukhruf', 'arti' => 'Perhiasan', 'jumlah_ayat' => 89, 'posisi_juz' => 'Juz 25'],
            ['nama_surah' => 'Ad-Dukhan', 'arti' => 'Kabut', 'jumlah_ayat' => 59, 'posisi_juz' => 'Juz 25'],
            ['nama_surah' => 'Al-Jasiyah', 'arti' => 'Yang Berlutut', 'jumlah_ayat' => 37, 'posisi_juz' => 'Juz 25'],
            ['nama_surah' => 'Al-Ahqaf', 'arti' => 'Bukit-bukit Pasir', 'jumlah_ayat' => 35, 'posisi_juz' => 'Juz 26'],
            ['nama_surah' => 'Muhammad', 'arti' => 'Nabi Muhammad', 'jumlah_ayat' => 38, 'posisi_juz' => 'Juz 26'],
            ['nama_surah' => 'Al-Fath', 'arti' => 'Kemenangan', 'jumlah_ayat' => 29, 'posisi_juz' => 'Juz 26'],
            ['nama_surah' => 'Al-Hujurat', 'arti' => 'Kamar-kamar', 'jumlah_ayat' => 18, 'posisi_juz' => 'Juz 26'],
            ['nama_surah' => 'Qaf', 'arti' => 'Qaf', 'jumlah_ayat' => 45, 'posisi_juz' => 'Juz 26'],
            ['nama_surah' => 'Az-Zariyat', 'arti' => 'Angin yang Menerbangkan', 'jumlah_ayat' => 60, 'posisi_juz' => 'Juz 26 - 27'],
            ['nama_surah' => 'At-Tur', 'arti' => 'Bukit', 'jumlah_ayat' => 49, 'posisi_juz' => 'Juz 27'],
            ['nama_surah' => 'An-Najm', 'arti' => 'Bintang', 'jumlah_ayat' => 62, 'posisi_juz' => 'Juz 27'],
            ['nama_surah' => 'Al-Qamar', 'arti' => 'Bulan', 'jumlah_ayat' => 55, 'posisi_juz' => 'Juz 27'],
            ['nama_surah' => 'Ar-Rahman', 'arti' => 'Maha Pemurah', 'jumlah_ayat' => 78, 'posisi_juz' => 'Juz 27'],
            ['nama_surah' => 'Al-Waqi\'ah', 'arti' => 'Hari Kiamat', 'jumlah_ayat' => 96, 'posisi_juz' => 'Juz 27'],
            ['nama_surah' => 'Al-Hadid', 'arti' => 'Besi', 'jumlah_ayat' => 29, 'posisi_juz' => 'Juz 27'],
            ['nama_surah' => 'Al-Mujadilah', 'arti' => 'Wanita yang Mengajukan Gugatan', 'jumlah_ayat' => 22, 'posisi_juz' => 'Juz 28'],
            ['nama_surah' => 'Al-Hasyr', 'arti' => 'Pengusiran', 'jumlah_ayat' => 24, 'posisi_juz' => 'Juz 28'],
            ['nama_surah' => 'Al-Mumtahanah', 'arti' => 'Wanita yang Diuji', 'jumlah_ayat' => 13, 'posisi_juz' => 'Juz 28'],
            ['nama_surah' => 'As-Saff', 'arti' => 'Satu Barisan', 'jumlah_ayat' => 14, 'posisi_juz' => 'Juz 28'],
            ['nama_surah' => 'Al-Jumu\'ah', 'arti' => 'Hari Jum\'at', 'jumlah_ayat' => 11, 'posisi_juz' => 'Juz 28'],
            ['nama_surah' => 'Al-Munafiqun', 'arti' => 'Orang-orang Munafik', 'jumlah_ayat' => 11, 'posisi_juz' => 'Juz 28'],
            ['nama_surah' => 'At-Tagabun', 'arti' => 'Hari Dinampakkan Kesalahan', 'jumlah_ayat' => 18, 'posisi_juz' => 'Juz 28'],
            ['nama_surah' => 'At-Talaq', 'arti' => 'Talak', 'jumlah_ayat' => 12, 'posisi_juz' => 'Juz 28'],
            ['nama_surah' => 'At-Tahrim', 'arti' => 'Mengharamkan', 'jumlah_ayat' => 12, 'posisi_juz' => 'Juz 28'],
            ['nama_surah' => 'Al-Mulk', 'arti' => 'Kerajaan', 'jumlah_ayat' => 30, 'posisi_juz' => 'Juz 29'],
            ['nama_surah' => 'Al-Qalam', 'arti' => 'Pena', 'jumlah_ayat' => 52, 'posisi_juz' => 'Juz 29'],
            ['nama_surah' => 'Al-Haqqah', 'arti' => 'Hari Kiamat', 'jumlah_ayat' => 52, 'posisi_juz' => 'Juz 29'],
            ['nama_surah' => 'Al-Ma\'arij', 'arti' => 'Tempat Naik', 'jumlah_ayat' => 44, 'posisi_juz' => 'Juz 29'],
            ['nama_surah' => 'Nuh', 'arti' => 'Nabi Nuh', 'jumlah_ayat' => 28, 'posisi_juz' => 'Juz 29'],
            ['nama_surah' => 'Al-Jinn', 'arti' => 'Jin', 'jumlah_ayat' => 28, 'posisi_juz' => 'Juz 29'],
            ['nama_surah' => 'Al-Muzzammil', 'arti' => 'Orang yang Berselimut', 'jumlah_ayat' => 20, 'posisi_juz' => 'Juz 29'],
            ['nama_surah' => 'Al-Muddassir', 'arti' => 'Orang yang Berkemul', 'jumlah_ayat' => 56, 'posisi_juz' => 'Juz 29'],
            ['nama_surah' => 'Al-Qiyamah', 'arti' => 'Kiamat', 'jumlah_ayat' => 40, 'posisi_juz' => 'Juz 29'],
            ['nama_surah' => 'Al-Insan', 'arti' => 'Manusia', 'jumlah_ayat' => 31, 'posisi_juz' => 'Juz 29'],
            ['nama_surah' => 'Al-Mursalat', 'arti' => 'Malaikat-Malaikat Yang Diutus', 'jumlah_ayat' => 50, 'posisi_juz' => 'Juz 29'],
            ['nama_surah' => 'An-Naba\'', 'arti' => 'Berita Besar', 'jumlah_ayat' => 40, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'An-Nazi\'at', 'arti' => 'Malaikat-Malaikat Yang Mencabut', 'jumlah_ayat' => 46, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => '\'Abasa', 'arti' => 'Ia Bermuka Masam', 'jumlah_ayat' => 42, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'At-Takwir', 'arti' => 'Menggulung', 'jumlah_ayat' => 29, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Infitar', 'arti' => 'Terbelah', 'jumlah_ayat' => 19, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Mutaffifin', 'arti' => 'Orang-orang yang Curang', 'jumlah_ayat' => 36, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Insyiqaq', 'arti' => 'Terbelah', 'jumlah_ayat' => 25, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Buruj', 'arti' => 'Gugusan Bintang', 'jumlah_ayat' => 22, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'At-Tariq', 'arti' => 'Yang Datang di Malam Hari', 'jumlah_ayat' => 17, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-A\'la', 'arti' => 'Yang Paling Tinggi', 'jumlah_ayat' => 19, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Gasyiyah', 'arti' => 'Hari Pembalasan', 'jumlah_ayat' => 26, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Fajr', 'arti' => 'Fajar', 'jumlah_ayat' => 30, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Balad', 'arti' => 'Negeri', 'jumlah_ayat' => 20, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Asy-Syams', 'arti' => 'Matahari', 'jumlah_ayat' => 15, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Lail', 'arti' => 'Malam', 'jumlah_ayat' => 21, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Ad-Duha', 'arti' => 'Waktu Matahari Sepenggalahan Naik', 'jumlah_ayat' => 11, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Asy-Syarh', 'arti' => 'Melapangkan', 'jumlah_ayat' => 8, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'At-Tin', 'arti' => 'Buah Tin', 'jumlah_ayat' => 8, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-\'Alaq', 'arti' => 'Segumpal Darah', 'jumlah_ayat' => 19, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Qadr', 'arti' => 'Kemuliaan', 'jumlah_ayat' => 5, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Bayyinah', 'arti' => 'Pembuktian', 'jumlah_ayat' => 8, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Az-Zalzalah', 'arti' => 'Kegoncangan', 'jumlah_ayat' => 8, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-\'Adiyat', 'arti' => 'Berlari Kencang', 'jumlah_ayat' => 11, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Qari\'ah', 'arti' => 'Hari Kiamat', 'jumlah_ayat' => 11, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'At-Takasur', 'arti' => 'Bermegah-megahan', 'jumlah_ayat' => 8, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-\'Asr', 'arti' => 'Masa', 'jumlah_ayat' => 3, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Humazah', 'arti' => 'Pengumpat', 'jumlah_ayat' => 9, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Fil', 'arti' => 'Gajah', 'jumlah_ayat' => 5, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Quraisy', 'arti' => 'Suku Quraisy', 'jumlah_ayat' => 4, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Ma\'un', 'arti' => 'Barang-barang yang Berguna', 'jumlah_ayat' => 7, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Kausar', 'arti' => 'Nikmat yang Berlimpah', 'jumlah_ayat' => 3, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Kafirun', 'arti' => 'Orang-orang Kafir', 'jumlah_ayat' => 6, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'An-Nasr', 'arti' => 'Pertolongan', 'jumlah_ayat' => 3, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Lahab', 'arti' => 'Gejolak Api', 'jumlah_ayat' => 5, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Ikhlas', 'arti' => 'Ikhlas', 'jumlah_ayat' => 4, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'Al-Falaq', 'arti' => 'Waktu Subuh', 'jumlah_ayat' => 5, 'posisi_juz' => 'Juz 30'],
            ['nama_surah' => 'An-Nas', 'arti' => 'Manusia', 'jumlah_ayat' => 6, 'posisi_juz' => 'Juz 30'],
        ];

        // Tambahkan timestamps
        $now = now();
        foreach ($quranData as &$data) {
            $data['created_at'] = $now;
            $data['updated_at'] = $now;
        }

        DB::table('master_qurans')->insert($quranData);
    }
}
