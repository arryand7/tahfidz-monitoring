<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeaturePermission
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $feature, string $level = 'view'): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (! $user->hasPermission($feature, $level)) {
            if ($level === 'manage') {
                abort(403, 'Akses ditolak. Peran '.$user->role.' hanya memiliki izin lihat (view only) dan tidak diizinkan menambah, mengubah, atau menghapus data.');
            }

            abort(403, 'Akses ditolak. Peran '.$user->role.' tidak diizinkan membuka fitur ini.');
        }

        return $next($request);
    }
}
