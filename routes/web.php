<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Foundation\Application;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/login', function () {
    return Inertia::render('Auth/Login');
})->name('login');

Route::get('/register', function () {
    return Inertia::render('Auth/Register');
})->name('register');

Route::get('/dashboard/guru-kelas', function () {
    return Inertia::render('Dashboard/GuruKelas');
})->name('dashboard.guru-kelas');

Route::get('/dashboard/guru-bk', function () {
    return Inertia::render('Dashboard/GuruBk');
})->name('dashboard.guru-bk');

Route::get('/dashboard/kepsek', function () {
    return Inertia::render('Dashboard/Kepsek');
})->name('dashboard.kepsek');

Route::get('/students/{id}', function ($id) {
    return Inertia::render('Students/Show', [
        'studentId' => $id,
    ]);
})->name('students.show');
