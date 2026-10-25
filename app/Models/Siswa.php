<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany; // Tambahkan import ini

class Siswa extends Model
{
    protected $guarded = ['id'];

    /**
     * Relasi: 1 Siswa bisa memiliki banyak (hasMany) Setoran
     */
    public function setorans(): HasMany
    {
        return $this->hasMany(Setoran::class);
    }
}
