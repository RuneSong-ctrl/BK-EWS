<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Controller: DashboardController
 * 
 * Central Role Dispatcher.
 * Mengarahkan pengguna ke sub-dashboard masing-masing sesuai hak akses peran (Role).
 */
class DashboardController extends Controller
{
    /**
     * Redirect user ke dashboard peran yang sesuai
     *
     * @param Request $request
     * @return RedirectResponse
     */
    public function index(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        if ($user->isGuruKelas()) {
            return redirect()->route('guru-kelas.dashboard');
        }

        if ($user->isGuruBk()) {
            return redirect()->route('guru-bk.dashboard');
        }

        if ($user->isKepsek()) {
            return redirect()->route('kepsek.dashboard');
        }

        return redirect()->route('login');
    }
}

