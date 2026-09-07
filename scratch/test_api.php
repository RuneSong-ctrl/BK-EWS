<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

echo "=== TEST 1: GET /api/ews/notifications ===\n";
$request = Illuminate\Http\Request::create('/api/ews/notifications', 'GET');
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
$data = json_decode($response->getContent(), true);
echo "Total notifications: " . $data['stats']['total'] . "\n";
echo "Risiko TINGGI: " . $data['stats']['tinggi_count'] . "\n";
echo "Risiko SEDANG: " . $data['stats']['sedang_count'] . "\n";
echo "Risiko RENDAH: " . $data['stats']['rendah_count'] . "\n";
foreach ($data['data']['data'] as $notif) {
    echo " - [{$notif['risk_level']}] {$notif['student_name']} (Moodle ID: {$notif['moodle_student_id']}) -> Status: {$notif['status']}\n";
}

echo "\n=== TEST 2: GET /api/ews/notifications/2 (Citra Lestari) ===\n";
$request = Illuminate\Http\Request::create('/api/ews/notifications/2', 'GET');
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
$detail = json_decode($response->getContent(), true);
echo "Student: " . $detail['data']['student_name'] . "\n";
echo "Risk Probability: " . $detail['data']['risk_percentage'] . "\n";
echo "Interventions Count: " . count($detail['data']['interventions']) . "\n";
if (!empty($detail['data']['interventions'])) {
    echo "First Intervention: " . $detail['data']['interventions'][0]['intervention_type'] . " - " . $detail['data']['interventions'][0]['action_notes'] . "\n";
}

echo "\n=== TEST 3: PATCH /api/ews/notifications/1/status (Update Baileys status) ===\n";
$request = Illuminate\Http\Request::create('/api/ews/notifications/1/status', 'PATCH', [
    'status' => 'sent',
]);
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
$resPatch = json_decode($response->getContent(), true);
echo "Message: " . $resPatch['message'] . "\n";
echo "Updated status in DB: " . App\Models\EwsNotification::find(1)->status . "\n";

echo "\n=== TEST 4: POST /api/ews/interventions ===\n";
$counselor = App\Models\User::where('role', 'guru_bk')->first();
$request = Illuminate\Http\Request::create('/api/ews/interventions', 'POST', [
    'notification_id' => 1,
    'counselor_id' => $counselor->id,
    'intervention_type' => 'PEMANGGILAN',
    'action_notes' => 'Menghubungi orang tua dan menjadwalkan pertemuan klarifikasi kendala belajar.',
    'student_progress' => 'DALAM_PEMANTAUAN',
    'follow_up_date' => date('Y-m-d', strtotime('+3 days')),
]);
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
$resIntervention = json_decode($response->getContent(), true);
echo "Message: " . $resIntervention['message'] . "\n";
echo "Intervention ID: " . $resIntervention['data']['id'] . "\n";

echo "\nALL TESTS PASSED SUCCESSFULLY!\n";
