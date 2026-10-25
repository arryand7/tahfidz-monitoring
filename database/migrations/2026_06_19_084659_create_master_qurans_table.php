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
        Schema::create('master_qurans', function (Blueprint $table) {
            $table->id(); // Ini otomatis akan menjadi Nomor Surah (1-114)
            $table->string('nama_surah', 100);
            $table->string('arti', 100);
            $table->integer('jumlah_ayat');
            $table->string('posisi_juz', 50);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_qurans');
    }
};
