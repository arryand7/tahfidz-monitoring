<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Setoran extends Model
{
    // Mengizinkan penyimpanan data secara massal (mass-assignment)
    protected $guarded = ['id'];

    /**
     * Relasi: Setiap 1 Setoran dibimbing oleh 1 Ustadz
     */
    public function ustadz(): BelongsTo
    {
        return $this->belongsTo(Ustadz::class);
    }

    /**
     * Relasi: Setiap 1 Setoran dimiliki oleh 1 Siswa
     */
    public function siswa(): BelongsTo
    {
        return $this->belongsTo(Siswa::class);
    }
}
