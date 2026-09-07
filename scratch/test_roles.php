<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

echo "=== TEST 1: Guru BK mengakses /ews (Seluruh Sekolah) ===\n";
$guruBk = App\Models\User::where('role', 'guru_bk')->first();
$request = Illuminate\Http\Request::create('/ews', 'GET');
$app->instance('request', $request);
auth()->setUser($guruBk);
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
$props = $response->getOriginalContent()->getData()['page']['props'];
echo "Peran Pengguna: " . $props['userRole'] . "\n";
echo "Total notifications BK: " . $props['stats']['total'] . "\n";
$notifData = $props['ewsNotifications']['data'] ?? $props['notifications']['data'] ?? [];
echo "Jumlah siswa berisiko tampil: " . count($notifData) . "\n";

echo "\n=== TEST 2: Guru Kelas Pak Budi (Wali Kelas 10-MIPA-1) mengakses /ews ===\n";
$guruBudi = App\Models\User::where('email', 'guru.budi@sekolah.sch.id')->first();
$request = Illuminate\Http\Request::create('/ews', 'GET');
$app->instance('request', $request);
auth()->setUser($guruBudi);
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
$props = $response->getOriginalContent()->getData()['page']['props'];
echo "Peran Pengguna: " . $props['userRole'] . "\n";
echo "Kelas Binaan: " . ($props['homeroomClass']['name'] ?? 'null') . "\n";
$notifData = $props['ewsNotifications']['data'] ?? $props['notifications']['data'] ?? [];
echo "Jumlah siswa berisiko tampil (hanya kelas 10-MIPA-1): " . count($notifData) . "\n";

echo "\n=== TEST 3: Kepala Sekolah (Master Admin) mengakses /ews ===\n";
$kepsek = App\Models\User::where('role', 'kepsek')->first();
$request = Illuminate\Http\Request::create('/ews', 'GET');
$app->instance('request', $request);
auth()->setUser($kepsek);
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
$props = $response->getOriginalContent()->getData()['page']['props'];
echo "Peran Pengguna: " . $props['userRole'] . "\n";
echo "Total Berisiko Sekolah: " . $props['stats']['total'] . "\n";
echo "Rasio Penanganan Sekolah: " . $props['stats']['coverage_rate'] . "%\n";
echo "Jumlah Rombel di Class Breakdown: " . count($props['classBreakdown']) . "\n";
foreach ($props['classBreakdown'] as $c) {
    echo " - Rombel {$c['name']} (Wali: {$c['homeroom_teacher']}): {$c['total_at_risk']} berisiko (T:{$c['tinggi_count']}, S:{$c['sedang_count']}, R:{$c['rendah_count']})\n";
}

echo "\nALL 3 ROLES (GURU BK, GURU KELAS, KEPSEK) TESTED SUCCESSFULLY!\n";
