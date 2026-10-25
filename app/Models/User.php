<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'username',
        'role',
        'status',
        'gate_user_uuid',
        'sso_sub',
        'sso_synced_at',
    ];

    /**
     * Cek apakah akun berstatus aktif.
     */
    public function isAktif(): bool
    {
        return strtolower($this->status ?? 'aktif') === 'aktif';
    }

    public function siswa(): HasOne
    {
        return $this->hasOne(Siswa::class, 'nis', 'username');
    }

    public function ustadz(): HasOne
    {
        return $this->hasOne(Ustadz::class, 'nip', 'username');
    }

    /**
     * Dapatkan record Siswa terkait jika user adalah Siswa.
     */
    public function getLinkedSiswa(): ?Siswa
    {
        if ($this->role !== 'Siswa') {
            return null;
        }

        return $this->siswa ?: Siswa::where('nis', $this->username)->orWhere('nama', $this->name)->first();
    }

    /**
     * Periksa apakah user memiliki hak akses ke fitur tertentu dengan tingkat akses tertentu.
     *
     * @param  string  $level  'view' atau 'manage'
     */
    public function hasPermission(string $feature, string $level = 'view'): bool
    {
        return RolePermission::isAllowed($this->role, $feature, $level);
    }

    /**
     * Helper apakah user boleh mengelola (tambah/edit/delete) pada fitur ini.
     */
    public function canManage(string $feature): bool
    {
        return RolePermission::canManage($this->role, $feature);
    }

    /**
     * Helper apakah user boleh melihat (minimal view) fitur ini.
     */
    public function canView(string $feature): bool
    {
        return RolePermission::canView($this->role, $feature);
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
