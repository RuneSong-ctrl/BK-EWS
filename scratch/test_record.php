<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::where('role', 'guru_bk')->first();
$summary = App\Models\EwsStudentSummary::first();

$request = Illuminate\Http\Request::create('/api/ews/counseling/record', 'POST', [
    'summary_id' => $summary->id,
    'jenis_layanan' => 'konseling_individu',
    'catatan_konseling' => 'Uji konseling dari terminal',
    'rencana_tindak_lanjut' => 'Pantau tugas mandiri',
    'evaluasi_perilaku' => 'membaik',
    'tanggal_monitoring_berikutnya' => '2026-09-15',
]);
$request->setUserResolver(fn() => $user);

$controller = new App\Http\Controllers\Api\EwsApiController();
try {
    $response = $controller->storeCounselingRecord($request);
    echo "STATUS: " . $response->getStatusCode() . PHP_EOL;
    echo "CONTENT: " . $response->getContent() . PHP_EOL;
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . PHP_EOL . $e->getTraceAsString();
}
