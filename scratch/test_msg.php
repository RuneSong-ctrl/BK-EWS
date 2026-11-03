<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$alert = \App\Models\EwsCourseAlert::first();
$generator = new \App\Services\Ai\AiNotificationGeneratorService();
echo "--- PREVIEW TIER 1 ---\n";
echo $generator->generateTier1Message($alert) . "\n\n";

$summary = \App\Models\EwsStudentSummary::first();
echo "--- PREVIEW TIER 2 ---\n";
echo $generator->generateTier2Message($summary) . "\n";
