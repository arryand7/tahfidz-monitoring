<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyBotSecret
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expected = config('services.wa_bot.secret_key');

        if (! $expected || $request->header('X-Bot-Secret-Key') !== $expected) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized.',
            ], 401);
        }

        return $next($request);
    }
}
