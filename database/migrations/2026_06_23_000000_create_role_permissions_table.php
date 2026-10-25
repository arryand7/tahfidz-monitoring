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
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role', 30); // Admin, Ustadz, Siswa
            $table->string('feature', 50); // dashboard, rekap_setoran, input_setoran, dll.
            $table->boolean('is_allowed')->default(true);
            $table->timestamps();

            $table->unique(['role', 'feature']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
    }
};
