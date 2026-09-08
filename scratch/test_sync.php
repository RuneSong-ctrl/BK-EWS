<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::where('role', 'admin')->first();
$request = Illuminate\Http\Request::create('/admin/moodle/sync', 'POST');
$request->setUserResolver(fn() => $user);

$controller = new App\Http\Controllers\Admin\MoodleSyncController();
try {
    $response = $controller->syncNow($request);
    echo "STATUS: " . (method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 'Redirect') . PHP_EOL;
    if (session()->has('error')) {
        echo "SESSION ERROR: " . session('error') . PHP_EOL;
    }
    if (session()->has('success')) {
        echo "SESSION SUCCESS: " . session('success') . PHP_EOL;
    }
} catch (\Throwable $e) {
    echo "THROWN ERROR: " . $e->getMessage() . PHP_EOL . $e->getTraceAsString();
}
