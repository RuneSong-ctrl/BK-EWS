<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        $user = $request->user();

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
