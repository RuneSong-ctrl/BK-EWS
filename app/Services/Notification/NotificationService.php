<?php

namespace App\Services\Notification;

use App\Models\AttendanceRecord;
use App\Models\BkCase;
use App\Models\EwsScore;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;

/**
 * Service: NotificationService
 * 
 * Menghasilkan notifikasi real-time berbasis data riil database untuk setiap role
 * pendidik (Guru Kelas, Guru BK, Kepala Sekolah).
 */
class NotificationService
{
    /**
     * Dapatkan daftar notifikasi dinamis untuk user yang sedang login
     *
     * @param User $user
     * @return array<int, array{id: string, title: string, message: string, time: string, level: string, read: bool}>
     */
    public function getNotificationsForUser(User $user): array
    {
        $notifications = [];

        if ($user->isGuruKelas()) {
            $homeroomClass = SchoolClass::where('homeroom_teacher_id', $user->id)->first();
            if (!$homeroomClass) {
                $homeroomClass = SchoolClass::first();
            }

            if ($homeroomClass) {
                // 1. Cek Siswa Kritis / Waspada di Kelas Binaan
                $atRiskStudents = Student::whereHas('enrollments', function ($q) use ($homeroomClass) {
                    $q->where('class_id', $homeroomClass->id)->where('is_current', true);
                })
                ->whereHas('ewsScore', function ($q) {
                    $q->whereIn('status', ['KRITIS', 'WASPADA']);
                })
                ->with('ewsScore')
                ->get();

                if ($atRiskStudents->isNotEmpty()) {
                    $kritis = $atRiskStudents->where('ewsScore.status', 'KRITIS');
                    $studentNames = $atRiskStudents->pluck('name')->take(2)->implode(', ');
                    if ($atRiskStudents->count() > 2) {
                        $studentNames .= ' +' . ($atRiskStudents->count() - 2) . ' lainnya';
                    }

                    $notifications[] = [
                        'id' => 'notif-ews-gk-' . $homeroomClass->id,
                        'title' => 'Peringatan EWS: ' . $atRiskStudents->count() . ' Siswa Butuh Atensi',
                        'message' => "Siswa {$studentNames} di {$homeroomClass->name} berstatus " . ($kritis->isNotEmpty() ? 'KRITIS' : 'WASPADA') . '. Segera tinjau evaluasi 4 pilar.',
                        'time' => 'Terkini',
                        'level' => 'kritis',
                        'read' => false,
                    ];
                }

                // 2. Cek Presensi Hari Ini
                $todayAttExists = AttendanceRecord::whereHas('student.enrollments', function ($q) use ($homeroomClass) {
                    $q->where('class_id', $homeroomClass->id)->where('is_current', true);
                })
                ->whereDate('date', Carbon::today())
                ->exists();

                if (!$todayAttExists) {
                    $notifications[] = [
                        'id' => 'notif-att-' . Carbon::today()->toDateString(),
                        'title' => 'Pengingat Presensi: ' . $homeroomClass->name,
                        'message' => 'Rekap presensi harian untuk ' . $homeroomClass->name . ' belum dicatat hari ini (' . Carbon::today()->translatedFormat('d M Y') . ').',
                        'time' => 'Hari ini',
                        'level' => 'info',
                        'read' => false,
                    ];
                }
            }
        } elseif ($user->isGuruBk()) {
            // 1. Kasus BK Baru / Dalam Proses Urgensi Tinggi
            $urgentCases = BkCase::whereIn('status', ['BARU_DILAPORKAN', 'DALAM_PROSES'])
                ->whereIn('severity', ['BERAT', 'SEDANG'])
                ->with('student')
                ->latest('incident_date')
                ->take(3)
                ->get();

            if ($urgentCases->isNotEmpty()) {
                $notifications[] = [
                    'id' => 'notif-bk-cases',
                    'title' => 'Kasus Bimbingan Konseling Aktif',
                    'message' => 'Terdapat ' . $urgentCases->count() . ' sesi bimbingan aktif dengan tingkat urgensi sedang/berat yang memerlukan tindak lanjut.',
                    'time' => 'Terkini',
                    'level' => 'kritis',
                    'read' => false,
                ];
            }

            // 2. Siswa Kritis Seluruh Sekolah
            $criticalCount = EwsScore::where('status', 'KRITIS')->count();
            if ($criticalCount > 0) {
                $notifications[] = [
                    'id' => 'notif-bk-kritis',
                    'title' => 'Pantauan EWS: ' . $criticalCount . ' Siswa Kritis',
                    'message' => 'Terdapat ' . $criticalCount . ' siswa sekolah berstatus Kritis pada evaluasi 4 pilar. Cek Matriks Konseling.',
                    'time' => 'Real-time',
                    'level' => 'kritis',
                    'read' => false,
                ];
            }
        } elseif ($user->isKepsek()) {
            // 1. Kasus Eskalasi ke Kepsek
            $escalatedCases = BkCase::where('status', 'DIESKALASI_KE_KEPSEK')
                ->with('student')
                ->get();

            if ($escalatedCases->isNotEmpty()) {
                $notifications[] = [
                    'id' => 'notif-kepsek-cases',
                    'title' => 'Eskalasi Kasus BK ke Kepala Sekolah',
                    'message' => 'Terdapat ' . $escalatedCases->count() . ' kasus siswa memerlukan telaah dan arahan kebijakan Kepala Sekolah.',
                    'time' => 'Mendesak',
                    'level' => 'kritis',
                    'read' => false,
                ];
            }

            // 2. Ringkasan Kondisi Sekolah
            $schoolCritical = EwsScore::where('status', 'KRITIS')->count();
            if ($schoolCritical > 0) {
                $notifications[] = [
                    'id' => 'notif-kepsek-school',
                    'title' => 'Peringatan Dini Populasi Sekolah',
                    'message' => "Terdapat {$schoolCritical} siswa terindikasi risiko Kritis di seluruh jenjang kelas.",
                    'time' => 'Hari ini',
                    'level' => 'kritis',
                    'read' => false,
                ];
            }
        }

        // 3. Notifikasi Default Sistem AI jika list masih kosong
        if (empty($notifications)) {
            $notifications[] = [
                'id' => 'notif-system-all-clear',
                'title' => 'Kondisi EWS Terkendali',
                'message' => 'Tidak ada anomali berisiko tinggi atau kasus mendesak yang memerlukan tindakan saat ini.',
                'time' => 'Terkini',
                'level' => 'info',
                'read' => true,
            ];
        }

        return $notifications;
    }
}
