<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$svc = app(App\Services\Ai\AiTextStructuringService::class);
$res = $svc->structureBkObservation('Siswa sering melamun dan menarik diri dari teman sebaya.', ['student_name' => 'Aditya Pratama']);
echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
