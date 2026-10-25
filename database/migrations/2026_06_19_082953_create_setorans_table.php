<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('setorans', function (Blueprint $table) {
            $table->id();
            // Relasi ke tabel ustadz dan siswa
            $table->foreignId('ustadz_id')->constrained('ustadzs')->onDelete('cascade');
            $table->foreignId('siswa_id')->constrained('siswas')->onDelete('cascade');

            // Detail Setoran
            $table->date('tanggal');
            $table->enum('jenis', ['Hafalan', 'Murojaah']);
            $table->string('surah', 100); // Sementara pakai string sebelum Master Quran disambungkan
            $table->string('ayat_awal', 10);
            $table->string('ayat_akhir', 10);
            $table->enum('nilai', ['Baik', 'Cukup', 'Kurang']);
            $table->text('catatan')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('setorans');
    }
};
