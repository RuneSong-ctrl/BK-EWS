<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/Login');
    }

    public function login(Request $request): RedirectResponse
    {
        $input = $request->validate([
            'identifier' => ['required', 'string'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $identifier = trim($input['identifier']);
        $field = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'nip';

        $credentials = [
            $field => $identifier,
            'password' => $input['password'],
        ];

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->intended(route('dashboard'));
        }

        return back()->withErrors([
            'identifier' => 'NIP/Email atau kata sandi tidak cocok dengan akun terdaftar.',
        ])->onlyInput('identifier');
    }

    public function showRegister(): Response|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/Register');
    }

    public function register(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'nip' => ['required', 'string', 'max:50', 'unique:users,nip'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'string', 'in:guru_kelas,guru_bk,kepsek'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'nip' => $validated['nip'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard')->with('success', 'Akun pendidik berhasil didaftarkan.');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}

