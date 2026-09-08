<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (App\Models\EwsCourseAlert::all() as $a) {
    echo $a->kode_modul . ' - ' . ($a->student ? $a->student->name : 'N/A') . ' (' . $a->tingkat_risiko . ')' . PHP_EOL;
}
