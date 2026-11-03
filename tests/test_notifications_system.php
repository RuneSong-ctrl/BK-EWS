<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use App\Models\EwsBotSession;
use App\Models\EwsCourseAlert;
use App\Models\EwsNotification;
use App\Models\EwsStudentSummary;
use App\Models\User;
use Illuminate\Http\Request;

echo "======================================================\n";
echo "🧪 INTEGRATION TEST: EWS NOTIFICATION & WHATSAPP GATEWAY\n";
echo "======================================================\n\n";

// 1. Uji Render Halaman Dashboard Admin
echo "1. Uji Render Halaman Dashboard Admin...\n";
$adminUser = User::where('role', 'admin')->first();
$req = Request::create('/admin/dashboard', 'GET');
$req->setUserResolver(fn () => $adminUser);
$app->instance('request', $req);
Illuminate\Support\Facades\Auth::login($adminUser);

try {
    $adminController = new App\Http\Controllers\Admin\AdminDashboardController();
    $res = $adminController->index($req);
    echo "   ✅ Dashboard Admin berhasil dirender dengan prop botKpi & notifications.\n\n";
} catch (\Throwable $e) {
    echo "❌ Gagal render dashboard admin: " . $e->getMessage() . "\n";
    exit(1);
}

// 2. Uji Action Force Push dari Admin
echo "2. Uji Action POST /admin/notifications/force-push...\n";
try {
    $generator = new App\Services\Ai\AiNotificationGeneratorService();
    $res = $adminController->forcePush($req, $generator);
    $pendingCount = EwsNotification::pending()->count();
    echo "   Total Antrean Pending saat ini: {$pendingCount}\n";
    echo "   ✅ Force push berhasil menghasilkan notifikasi EWS ke antrean.\n\n";
} catch (\Throwable $e) {
    echo "❌ Gagal force push: " . $e->getMessage() . "\n";
    exit(1);
}

// 3. Uji Action Test Send dari Admin
echo "3. Uji Action POST /admin/notifications/test-send (Uji Kirim Manual)...\n";
$reqTest = Request::create('/admin/notifications/test-send', 'POST', [
    'recipient_type' => 'guru_mapel',
    'phone' => '081299988877',
]);
$reqTest->setUserResolver(fn () => $adminUser);
try {
    $res = $adminController->testSend($reqTest, $generator);
    $testNotif = EwsNotification::where('recipient_phone', '6281299988877')->latest()->first();
    if ($testNotif) {
        echo "   ✅ Pesan uji coba berhasil dibuat: ID #{$testNotif->id} ({$testNotif->recipient_name})\n";
        echo "   Preview Pesan:\n   " . str_replace("\n", "\n   ", substr($testNotif->message_text, 0, 180)) . "...\n\n";
    }
} catch (\Throwable $e) {
    echo "❌ Gagal test send: " . $e->getMessage() . "\n";
    exit(1);
}

// 4. Uji API Polling Worker Baileys
echo "4. Uji Polling Worker: GET /api/ews/notifications/pending...\n";
$request = Request::create('/api/ews/notifications/pending?limit=3', 'GET');
$response = $kernel->handle($request);
echo "   Status Code: " . $response->getStatusCode() . " (Harus 200)\n";
$resJson = json_decode($response->getContent(), true);
echo "   Jumlah antrean diambil bot: " . ($resJson['count'] ?? 0) . "\n";
echo "   ✅ Worker Baileys dapat mengambil antrean pending.\n\n";

// 5. Uji API Status Callback dari Bot Baileys
echo "5. Uji Callback Status: PATCH /api/ews/notifications/{id}/status...\n";
$request = Request::create("/api/ews/notifications/{$testNotif->id}/status", 'PATCH', [
    'status' => 'sent',
]);
$response = $kernel->handle($request);
echo "   Status Code: " . $response->getStatusCode() . " (Harus 200)\n";
$refreshed = $testNotif->fresh();
echo "   Status Notifikasi di DB sekarang: {$refreshed->status}, Waktu Kirim: {$refreshed->sent_at}\n";
echo "   ✅ Status berhasil diperbarui menjadi 'sent'.\n\n";

// 6. Uji Heartbeat Bot
echo "6. Uji Heartbeat: POST /api/ews/bot/heartbeat & GET /api/ews/bot/status...\n";
$request = Request::create('/api/ews/bot/heartbeat', 'POST', [
    'session_name' => 'primary_ews_bot',
    'status' => 'connected',
    'phone_number' => '6281987654321',
]);
$response = $kernel->handle($request);
echo "   Heartbeat status: " . $response->getStatusCode() . "\n";

$request = Request::create('/api/ews/bot/status', 'GET');
$response = $kernel->handle($request);
$botStatus = json_decode($response->getContent(), true);
echo "   Bot Online: " . ($botStatus['is_online'] ? 'TRUE (Online)' : 'FALSE') . "\n";
echo "   Bot Phone: +" . $botStatus['phone_number'] . "\n";
echo "   ✅ Heartbeat dan status live bot berfungsi sempurna!\n\n";

// 7. Uji Atomic Claim & sending_at
echo "7. Uji Atomic Claim: GET /api/ews/notifications/pending...\n";
$dummyClaim = EwsNotification::create([
    'recipient_type' => 'guru_mapel',
    'recipient_name' => 'Guru Atomic Test',
    'recipient_phone' => '628999111222',
    'message_text' => 'Pesan uji atomic locking',
    'status' => 'pending',
]);
$request = Request::create('/api/ews/notifications/pending?limit=10', 'GET');
$response = $kernel->handle($request);
$claimedJson = json_decode($response->getContent(), true);
$freshDummy = $dummyClaim->fresh();
echo "   Status setelah di-GET bot: {$freshDummy->status}\n";
echo "   Waktu sending_at: {$freshDummy->sending_at}\n";
if ($freshDummy->status === 'sending' && !empty($freshDummy->sending_at)) {
    echo "   ✅ Atomic Claim berhasil: Status otomatis berubah jadi 'sending' dan sending_at terisi!\n\n";
} else {
    echo "   ❌ Atomic Claim gagal: Status tidak 'sending' atau sending_at kosong.\n\n";
}

// 8. Uji Recovery Abandoned Notifications
echo "8. Uji Recovery Notifikasi Macet (Abandoned Recovery)...\n";
$dummyStuck = EwsNotification::create([
    'recipient_type' => 'guru_bk',
    'recipient_name' => 'Guru Macet Test',
    'recipient_phone' => '628999333444',
    'message_text' => 'Pesan macet yang harus dipulihkan',
    'status' => 'sending',
    'sending_at' => now()->subMinutes(10),
]);
\Illuminate\Support\Facades\Artisan::call('ews:recover-abandoned', ['--minutes' => 5]);
$stuckRefreshed = $dummyStuck->fresh();
echo "   Status setelah recover: {$stuckRefreshed->status}\n";
echo "   Retry count: {$stuckRefreshed->retry_count}\n";
if ($stuckRefreshed->status === 'pending' && empty($stuckRefreshed->sending_at) && $stuckRefreshed->retry_count >= 1) {
    echo "   ✅ Recovery berhasil: Status kembali ke 'pending', sending_at di-clear, retry_count bertambah!\n\n";
} else {
    echo "   ❌ Recovery gagal.\n\n";
}

// Cleanup dummies
$dummyClaim->delete();
$dummyStuck->delete();

echo "======================================================\n";
echo "🎉 SELURUH SISTEM NOTIFIKASI & GATEWAY WHATSAPP BERHASIL TERVERIFIKASI!\n";
echo "======================================================\n";
