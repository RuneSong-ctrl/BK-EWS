<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CourseMapping;
use App\Models\EwsCourseAlert;
use App\Models\EwsStudentSummary;
use App\Models\MoodleSyncLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $lastSync = MoodleSyncLog::with('user')->latest()->first();
        $totalCourses = CourseMapping::count();
        $totalSummaries = EwsStudentSummary::count();
        $highRiskCount = EwsStudentSummary::where('prioritas_konseling', 'TINGGI')->count();
        $mediumRiskCount = EwsStudentSummary::where('prioritas_konseling', 'SEDANG')->count();
        $lowRiskCount = EwsStudentSummary::where('prioritas_konseling', 'RENDAH')->count();

        $courseMappings = CourseMapping::orderBy('code_module')->get();
        $syncLogs = MoodleSyncLog::with('user')->latest()->take(15)->get();

        return Inertia::render('Dashboard/Admin', [
            'kpi' => [
                'moodle_status' => 'connected',
                'moodle_url' => config('services.moodle.url', 'https://moodle.smkn1mas.sch.id'),
                'last_sync_at' => $lastSync?->created_at?->diffForHumans() ?? 'Belum pernah',
                'last_sync_full' => $lastSync?->created_at?->format('d M Y, H:i') ?? '-',
                'total_courses' => $totalCourses,
                'total_students' => $totalSummaries,
                'high_risk_count' => $highRiskCount,
                'medium_risk_count' => $mediumRiskCount,
                'low_risk_count' => $lowRiskCount,
            ],
            'courseMappings' => $courseMappings,
            'syncLogs' => $syncLogs,
        ]);
    }
}
