<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

echo "=== TEST 1: Service AiNotificationGeneratorService ===\n";
$generator = new App\Services\Ai\AiNotificationGeneratorService();

$alert = App\Models\EwsCourseAlert::first();
if ($alert) {
    echo "Sample Alert found: ID {$alert->id} - {$alert->nama_mapel} ({$alert->guru_pengampu})\n";
    $msgTier1 = $generator->generateTier1Message($alert);
    echo "--- TIER 1 MESSAGE PREVIEW ---\n{$msgTier1}\n-----------------------------\n";
    
    $notif1 = $generator->createNotificationForTier1($alert);
    echo "Created Tier 1 Notification ID: {$notif1->id}, Recipient: {$notif1->recipient_name} ({$notif1->recipient_phone}), Status: {$notif1->status}\n";
} else {
    echo "No alert found!\n";
}

$summary = App\Models\EwsStudentSummary::first();
if ($summary) {
    echo "\nSample Summary found: ID {$summary->id} - Student ID {$summary->siswa_id}\n";
    $msgTier2 = $generator->generateTier2Message($summary, 'Siswa sering bolos dan belum mengerjakan tugas', 'Pak Wayan');
    echo "--- TIER 2 MESSAGE PREVIEW ---\n{$msgTier2}\n-----------------------------\n";
    
    $notif2 = $generator->createNotificationForTier2($summary, 'Siswa sering bolos dan belum mengerjakan tugas', 'Pak Wayan');
    echo "Created Tier 2 Notification ID: {$notif2->id}, Recipient: {$notif2->recipient_name} ({$notif2->recipient_phone}), Status: {$notif2->status}\n";
} else {
    echo "No summary found!\n";
}

echo "\n=== TEST 2: GET /api/ews/notifications/pending ===\n";
$request = Illuminate\Http\Request::create('/api/ews/notifications/pending', 'GET');
$response = $kernel->handle($request);
echo "Status Code: " . $response->getStatusCode() . "\n";
$json = json_decode($response->getContent(), true);
echo "Pending Count: " . ($json['count'] ?? 0) . "\n";

echo "\n=== TEST 3: PATCH /api/ews/notifications/{id}/status ===\n";
if (isset($notif1)) {
    $request = Illuminate\Http\Request::create("/api/ews/notifications/{$notif1->id}/status", 'PATCH', [
        'status' => 'sent',
    ]);
    $response = $kernel->handle($request);
    echo "Status Code: " . $response->getStatusCode() . "\n";
    $updated = App\Models\EwsNotification::find($notif1->id);
    echo "Updated Notification Status in DB: {$updated->status}, Sent At: {$updated->sent_at}\n";
}

echo "\n=== TEST 4: POST /api/ews/bot/heartbeat & GET /api/ews/bot/status ===\n";
$request = Illuminate\Http\Request::create('/api/ews/bot/heartbeat', 'POST', [
    'session_name' => 'primary_ews_bot',
    'status' => 'connected',
    'phone_number' => '628123456789',
]);
$response = $kernel->handle($request);
echo "Heartbeat Response: " . $response->getContent() . "\n";

$request = Illuminate\Http\Request::create('/api/ews/bot/status', 'GET');
$response = $kernel->handle($request);
echo "Bot Status Response: " . $response->getContent() . "\n";

echo "\nALL NOTIFICATION BACKEND TESTS COMPLETED!\n";
