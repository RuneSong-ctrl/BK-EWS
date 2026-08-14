<?php

namespace App\Jobs;

use App\Models\Student;
use App\Services\Ai\AiAdvisorService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class GenerateAiAdvisorAnalysisJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Student $student
    ) {}

    public function handle(AiAdvisorService $advisorService): void
    {
        $advisorService->generateAnalysis($this->student);
    }
}
