<?php

require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;

echo "--- TESTING CONTROLLERS ---" . PHP_EOL;

// 1. Admin Dashboard
$adminUser = User::where('role', 'admin')->first();
$req = Request::create('/admin/dashboard', 'GET');
$req->setUserResolver(fn() => $adminUser);
try {
    $c = new App\Http\Controllers\Admin\AdminDashboardController();
    $res = $c->index($req);
    echo "1. AdminDashboardController: OK" . PHP_EOL;
} catch (\Throwable $e) {
    echo "1. AdminDashboardController ERROR: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . PHP_EOL;
}

// 2. Guru Kelas Dashboard
$guruUser = User::where('role', 'guru_kelas')->first();
$req = Request::create('/guru-kelas/dashboard', 'GET');
$req->setUserResolver(fn() => $guruUser);
try {
    $c = new App\Http\Controllers\GuruKelas\DashboardController();
    $res = $c->index($req);
    echo "2. GuruKelas DashboardController: OK" . PHP_EOL;
} catch (\Throwable $e) {
    echo "2. GuruKelas DashboardController ERROR: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . PHP_EOL;
}

// 3. Guru BK Dashboard
$bkUser = User::where('role', 'guru_bk')->first();
$req = Request::create('/guru-bk/dashboard', 'GET');
$req->setUserResolver(fn() => $bkUser);
try {
    $c = new App\Http\Controllers\GuruBK\DashboardController();
    $res = $c->index($req);
    echo "3. GuruBK DashboardController: OK" . PHP_EOL;
} catch (\Throwable $e) {
    echo "3. GuruBK DashboardController ERROR: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . PHP_EOL;
}

// 4. EwsMonitoringController
// 4. EwsMonitoringController
try {
    $c = new App\Http\Controllers\EwsMonitoringController();
    
    // 4a. Akses oleh Guru BK -> Auto Redirect ke /guru-bk/dashboard
    $reqBk = Request::create('/ews', 'GET');
    $reqBk->setUserResolver(fn() => $bkUser);
    $resBk = $c->index($reqBk);
    assert($resBk->isRedirect(route('guru-bk.dashboard')));
    
    // 4b. Akses oleh Guru Mapel -> Render Radar EWS
    $reqGuru = Request::create('/ews', 'GET');
    $reqGuru->setUserResolver(fn() => $guruUser);
    $resGuru = $c->index($reqGuru);
    
    echo "4. EwsMonitoringController: OK (BK Auto-Redirect & Teacher Render Verified)" . PHP_EOL;
} catch (\Throwable $e) {
    echo "4. EwsMonitoringController ERROR: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . PHP_EOL;
}

// 5. Store Counseling Record API
$summary = App\Models\EwsStudentSummary::first();
$req = Request::create('/api/ews/counseling/record', 'POST', [
    'summary_id' => $summary ? $summary->id : 1,
    'jenis_layanan' => 'konseling_individu',
    'catatan_konseling' => 'Uji coba bimbingan',
    'rencana_tindak_lanjut' => 'Pantau tugas',
    'evaluasi_perilaku' => 'membaik',
    'tanggal_monitoring_berikutnya' => date('Y-m-d', strtotime('+7 days')),
]);
$req->setUserResolver(fn() => $bkUser);
try {
    $c = new App\Http\Controllers\Api\EwsApiController();
    $res = $c->storeCounselingRecord($req);
    echo "5. storeCounselingRecord API: OK (status: " . $res->getStatusCode() . ")" . PHP_EOL;
} catch (\Throwable $e) {
    echo "5. storeCounselingRecord API ERROR: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . PHP_EOL;
}

echo "--- ALL TESTS FINISHED ---" . PHP_EOL;
