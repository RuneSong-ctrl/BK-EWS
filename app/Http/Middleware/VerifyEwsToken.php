<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware: VerifyEwsToken
 *
 * Melindungi endpoint ingestion EWS. Hanya layanan ML yang mengirim header
 * X-EWS-Token sesuai EWS_API_TOKEN di .env yang boleh menulis data peringatan.
 */
class VerifyEwsToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = (string) config('services.ews.token');
        $apiKey = (string) config('services.ews.api_key');

        $headerToken = (string) $request->header('X-EWS-Token');
        $headerKey = (string) $request->header('X-EWS-Key');

        if ($token !== '' && hash_equals($token, $headerToken)) {
            return $next($request);
        }

        if ($apiKey !== '' && hash_equals($apiKey, $headerKey)) {
            return $next($request);
        }

        if ($token === '' && $apiKey === '') {
            return response()->json(['success' => false, 'message' => 'EWS_API_TOKEN atau EWS_API_KEY belum dikonfigurasi di server.'], 503);
        }

        return response()->json(['success' => false, 'message' => 'Kredensial EWS tidak valid (X-EWS-Token / X-EWS-Key).'], 401);
    }
}
