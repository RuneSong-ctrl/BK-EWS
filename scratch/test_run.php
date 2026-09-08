<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::where('role', 'guru_bk')->first();
$request = Illuminate\Http\Request::create('/guru-bk/dashboard', 'GET');
$request->headers->set('X-Inertia', 'true');
$request->setUserResolver(fn() => $user);

try {
    $controller = new App\Http\Controllers\GuruBK\DashboardController();
    $response = $controller->index($request);
    $json = $response->toResponse($request)->getContent();
    echo "Inertia content length: " . strlen($json) . PHP_EOL;
    $data = json_decode($json, true);
    echo "Component: " . $data['component'] . PHP_EOL;
    echo "Props keys: " . implode(', ', array_keys($data['props'])) . PHP_EOL;
    echo "StudentSummaries count: " . count($data['props']['studentSummaries']) . PHP_EOL;
    echo "Stats: " . json_encode($data['props']['stats']) . PHP_EOL;
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine() . PHP_EOL . $e->getTraceAsString();
}
