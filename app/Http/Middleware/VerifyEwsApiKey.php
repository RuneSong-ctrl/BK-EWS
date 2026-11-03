<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Melindungi endpoint mesin (pipeline & worker Telegram di VPS) dengan header X-EWS-Key.
 */
class VerifyEwsApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = (string) config('services.ews.api_key');

        // Fail-closed: tanpa kunci terkonfigurasi, endpoint mesin tidak boleh terbuka
        if ($key === '') {
            return response()->json(['success' => false, 'message' => 'EWS_API_KEY belum dikonfigurasi.'], 503);
        }

        if (!hash_equals($key, (string) $request->header('X-EWS-Key'))) {
            return response()->json(['success' => false, 'message' => 'Kunci API EWS tidak valid.'], 401);
        }

        return $next($request);
    }
}
