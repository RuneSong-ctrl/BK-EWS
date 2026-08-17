<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Student;
use App\Models\BkCase;
use App\Models\User;
use App\Services\Ews\EwsScoringService;

$student = Student::first();
echo "Student: {$student->name} (ID: {$student->id})\n";
$bkUser = User::where('role', 'guru_bk')->first();

// Create BK case
$case = BkCase::create([
    'student_id' => $student->id,
    'incident_date' => now()->toDateString(),
    'reported_date' => now()->toDateString(),
    'case_types' => ['SOSIAL_PERILAKU'],
    'bullying_role' => null,
    'severity' => 'SEDANG',
    'status' => 'DALAM_PROSES',
    'follow_up_actions' => ['Konseling Individu', 'Panggil Orang Tua'],
    'involved_students_count' => 1,
    'confidential_notes' => 'Siswa telah diajak berdialog dan menyetujui kontrak komitmen pendampingan.',
    'handled_by' => $bkUser->id,
]);

echo "Created BK Case ID: {$case->id}\n";

// Recalculate EWS
$scoring = app(EwsScoringService::class);
$scoring->evaluate($student);

$student->refresh();
echo "EWS Score BK Pilar: {$student->ewsScore->bk_sub_status}\n";
echo "EWS Score Overall: {$student->ewsScore->status}\n";
echo "Triggered params: " . json_encode($student->ewsScore->triggered_by_parameters) . "\n";

// Clean test record to leave DB in clean state
$case->delete();
$scoring->evaluate($student);
echo "Cleaned up test case successfully.\n";
