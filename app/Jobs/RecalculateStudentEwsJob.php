<?php

namespace App\Jobs;

use App\Models\Student;
use App\Services\Ews\EwsScoringService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class RecalculateStudentEwsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Student $student
    ) {}

    public function handle(EwsScoringService $scoringService): void
    {
        $score = $scoringService->evaluate($this->student);

        // Jika status menjadi WASPADA atau KRITIS, trigger AI Advisor Job
        if (in_array($score->status, ['WASPADA', 'KRITIS'])) {
            dispatch(new GenerateAiAdvisorAnalysisJob($this->student));
        }
    }
}
