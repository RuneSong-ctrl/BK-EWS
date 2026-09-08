<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$summary = App\Models\EwsStudentSummary::first();
echo "Type of rincian_per_mata_pelajaran in model: " . gettype($summary->rincian_per_mata_pelajaran) . PHP_EOL;
$array = $summary->toArray();
echo "Type of rincian_per_mata_pelajaran in toArray: " . gettype($array['rincian_per_mata_pelajaran']) . PHP_EOL;
if (is_array($array['rincian_per_mata_pelajaran'])) {
    echo "Is real array with count: " . count($array['rincian_per_mata_pelajaran']) . PHP_EOL;
}
