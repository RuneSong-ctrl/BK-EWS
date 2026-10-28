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
        $expected = (string) config('services.ews.token');

        if ($expected === '') {
            return response()->json(['success' => false, 'message' => 'EWS_API_TOKEN belum dikonfigurasi di server.'], 503);
        }

        if (!hash_equals($expected, (string) $request->header('X-EWS-Token'))) {
            return response()->json(['success' => false, 'message' => 'Token EWS tidak valid.'], 401);
        }

        return $next($request);
    }
}
