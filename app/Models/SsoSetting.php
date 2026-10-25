<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SsoSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'base_url',
        'client_id',
        'client_secret',
        'redirect_uri',
        'scopes',
        'local_path',
        'driver_mode',
        'is_enabled',
        'last_tested_at',
        'last_test_status',
        'last_test_message',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'last_tested_at' => 'datetime',
        ];
    }

    /**
     * Dapatkan instance pengaturan SSO aktif (singleton di database).
     */
    public static function current(): self
    {
        $setting = static::query()->first();

        if (! $setting) {
            $setting = static::create([
                'base_url' => config('services.gate.url', 'https://gate.sabira-iibs.id'),
                'client_id' => config('services.gate.client_id'),
                'client_secret' => config('services.gate.client_secret'),
                'redirect_uri' => config('services.gate.redirect_uri'),
                'scopes' => config('services.gate.scopes', 'openid profile email roles'),
                'local_path' => config('services.gate.local_path', '/Users/ryand/Documents/LARAVEL/sabira/gate-sso'),
                'driver_mode' => 'auto',
                'is_enabled' => true,
            ]);
        }

        return $setting;
    }

    public function getEffectiveBaseUrl(): string
    {
        $url = $this->base_url ?: config('services.gate.url', 'https://gate.sabira-iibs.id');

        return rtrim($url, '/');
    }

    public function getEffectiveClientId(): ?string
    {
        return $this->client_id ?: config('services.gate.client_id');
    }

    public function getEffectiveClientSecret(): ?string
    {
        return $this->client_secret ?: config('services.gate.client_secret');
    }

    public function getEffectiveRedirectUri(): string
    {
        if (! empty($this->redirect_uri)) {
            return $this->redirect_uri;
        }

        $configUri = config('services.gate.redirect_uri');
        if (! empty($configUri)) {
            return $configUri;
        }

        try {
            return route('sso.callback');
        } catch (\Throwable) {
            return url('/sso/callback');
        }
    }

    public function getEffectiveScopes(): string
    {
        return $this->scopes ?: config('services.gate.scopes', 'openid profile email roles');
    }

    public function getEffectiveLocalPath(): ?string
    {
        return $this->local_path ?: config('services.gate.local_path');
    }
}
