<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->guest(route('login'));
        }

        if (!in_array($user->role, $roles)) {
            // Jika user mengakses modul yang bukan perannya, alihkan ke dashboard perannya sendiri
            return redirect()->route('dashboard')->with('error', 'Akses Ditolak: Peran akun Anda (' . $user->role . ') tidak memiliki izin untuk membuka halaman tersebut.');
        }

        return $next($request);
    }
}
