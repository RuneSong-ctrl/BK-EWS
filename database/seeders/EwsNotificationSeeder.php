<?php

namespace Database\Seeders;

use App\Models\EwsIntervention;
use App\Models\EwsNotification;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class EwsNotificationSeeder extends Seeder
{
    public function run(): void
    {
        // Temukan akun Guru BK (Rahmawati, S.Pd., M.Psi.)
        $counselor = User::where('role', 'guru_bk')->first() ?? User::first();
        $counselorId = $counselor?->id;
        $counselorPhone = '6281234567890';

        // 5 Profil Siswa dari Kontrak Data Fase 1
        $samples = [
            [
                'moodle_student_id' => '102444',
                'student_name' => 'Budi Santoso',
                'class_name' => '10-MIPA-2',
                'nis' => null,
                'course_code' => 'BBB (Matematika)',
                'academic_period' => '2026/2027-Ganjil',
                'risk_level' => 'TINGGI',
                'risk_probability' => 0.9808,
                'risk_percentage' => '98.1%',
                'decision_threshold' => 0.40,
                'intervention_urgency' => 'Tinggi (butuh intervensi/pemanggilan langsung dalam minggu ini)',
                'moodle_metrics' => [
                    'days_inactive' => 35,
                    'total_clicks' => 18,
                    'active_days' => 2,
                    'missing_assignments' => 3,
                    'tasks_submitted' => 1,
                    'late_submission_count' => 2,
                    'avg_submission_gap' => 5.5,
                    'avg_score' => 38.0,
                    'min_score' => 25.0,
                ],
                'risk_factors' => [
                    'Tidak aktif di Moodle selama 35 hari berturut-turut.',
                    'Ada 3 tugas/kuis yang belum dikumpulkan.',
                    'Rata-rata nilai kuis di bawah standar (38.0/100).',
                    'Tercatat 2 kali mengumpulkan tugas terlambat.',
                    'Frekuensi akses materi sangat minim (hanya 18 klik).',
                ],
                'ai_narration' => "Siswa Budi Santoso (10-MIPA-2) terdeteksi memiliki risiko akademik TINGGI (98.1%) pada mata pelajaran BBB. Terdeteksi tidak pernah login ke Moodle selama 35 hari dan memiliki 3 tugas tertunggak. Nilai kuis rata-rata 38.0 mengindikasikan kesulitan pemahaman konsep dasar. Disarankan pemanggilan langsung untuk konseling tatap muka minggu ini.",
                'wa_message' => "🚨 *PERINGATAN DINI EWS STIKMAS*\n\nSiswa: *Budi Santoso* (Kelas 10-MIPA-2)\nRisiko: *TINGGI (98.1%)*\nMapel: Matematika (BBB)\n\nFaktor Pemicu:\n- Tidak aktif di LMS Moodle selama 35 hari berturut-turut.\n- Ada 3 tugas/kuis yang belum dikumpulkan.\n- Nilai rata-rata 38.0/100.\n\nRekomendasi Tindakan:\nMohon segera jadwalkan sesi konseling individu atau pemanggilan siswa pada pekan ini.",
                'status' => 'ready',
                'sent_at' => null,
            ],
            [
                'moodle_student_id' => '204551',
                'student_name' => 'Citra Lestari',
                'class_name' => '10-MIPA-1',
                'nis' => '1004',
                'course_code' => 'CCC (Fisika)',
                'academic_period' => '2026/2027-Ganjil',
                'risk_level' => 'TINGGI',
                'risk_probability' => 0.8770,
                'risk_percentage' => '87.7%',
                'decision_threshold' => 0.40,
                'intervention_urgency' => 'Tinggi (butuh intervensi/pemanggilan langsung dalam minggu ini)',
                'moodle_metrics' => [
                    'days_inactive' => 16,
                    'total_clicks' => 45,
                    'active_days' => 8,
                    'missing_assignments' => 1,
                    'tasks_submitted' => 3,
                    'late_submission_count' => 2,
                    'avg_submission_gap' => 2.0,
                    'avg_score' => 58.5,
                    'min_score' => 40.0,
                ],
                'risk_factors' => [
                    'Tidak aktif di Moodle selama 16 hari berturut-turut.',
                    'Ada 1 tugas/kuis yang belum dikumpulkan.',
                    'Tercatat 2 kali mengumpulkan tugas terlambat.',
                ],
                'ai_narration' => "Siswa Citra Lestari (10-MIPA-1) menunjukkan penurunan keterlibatan belajar signifikan dengan skor risiko 87.7%. Inaktif 16 hari dengan keterlambatan berulang pada tugas Fisika. Perlu ditelusuri apakah terdapat kendala sarana atau kesulitan belajar.",
                'wa_message' => "🚨 *PERINGATAN DINI EWS STIKMAS*\n\nSiswa: *Citra Lestari* (Kelas 10-MIPA-1)\nRisiko: *TINGGI (87.7%)*\nMapel: Fisika (CCC)\n\nFaktor Pemicu:\n- Tidak aktif di Moodle 16 hari.\n- 1 tugas belum dikumpulkan & 2 kali terlambat.\n\nRekomendasi Tindakan:\nDisarankan konfirmasi santai atau klarifikasi kendala belajar kepada siswa.",
                'status' => 'sent',
                'sent_at' => now()->subDay(),
            ],
            [
                'moodle_student_id' => '65002',
                'student_name' => 'Ahmad Fauzan',
                'class_name' => '10-MIPA-1',
                'nis' => '1001',
                'course_code' => 'AAA (Bahasa Inggris)',
                'academic_period' => '2026/2027-Ganjil',
                'risk_level' => 'SEDANG',
                'risk_probability' => 0.6930,
                'risk_percentage' => '69.3%',
                'decision_threshold' => 0.40,
                'intervention_urgency' => 'Sedang (disarankan pemantauan aktif dan konfirmasi santai)',
                'moodle_metrics' => [
                    'days_inactive' => 50,
                    'total_clicks' => 3,
                    'active_days' => 2,
                    'missing_assignments' => 2,
                    'tasks_submitted' => 0,
                    'late_submission_count' => 0,
                    'avg_submission_gap' => 0,
                    'avg_score' => 0,
                    'min_score' => 0,
                ],
                'risk_factors' => [
                    'Tidak aktif di Moodle selama 50 hari berturut-turut.',
                    'Ada 2 tugas/kuis yang belum dikumpulkan.',
                    'Frekuensi akses materi sangat minim (hanya 3 klik).',
                ],
                'ai_narration' => "Siswa Ahmad Fauzan menunjukkan tingkat interaksi digital yang sangat rendah (hanya 3 klik materi). Berada pada kategori SEDANG (69.3%), disarankan pendekatan personal untuk mendorong kembali aktivitas belajar mandiri di LMS.",
                'wa_message' => "⚠️ *PERINGATAN DINI EWS STIKMAS*\n\nSiswa: *Ahmad Fauzan* (Kelas 10-MIPA-1)\nRisiko: *SEDANG (69.3%)*\nMapel: Bahasa Inggris (AAA)\n\nFaktor Pemicu:\n- Akses materi sangat jarang (3 klik).\n- Inaktif 50 hari di LMS.\n\nRekomendasi Tindakan:\nPemantauan berkala dan motivasi belajar melalui wali kelas.",
                'status' => 'ready',
                'sent_at' => null,
            ],
            [
                'moodle_student_id' => '410998',
                'student_name' => 'Eko Prasetyo',
                'class_name' => '10-MIPA-1',
                'nis' => '1005',
                'course_code' => 'EEE (Kimia)',
                'academic_period' => '2026/2027-Ganjil',
                'risk_level' => 'TINGGI',
                'risk_probability' => 0.8710,
                'risk_percentage' => '87.1%',
                'decision_threshold' => 0.40,
                'intervention_urgency' => 'Tinggi (butuh intervensi/pemanggilan langsung dalam minggu ini)',
                'moodle_metrics' => [
                    'days_inactive' => 15,
                    'total_clicks' => 52,
                    'active_days' => 6,
                    'missing_assignments' => 1,
                    'tasks_submitted' => 2,
                    'late_submission_count' => 1,
                    'avg_submission_gap' => 1.0,
                    'avg_score' => 62.0,
                    'min_score' => 45.0,
                ],
                'risk_factors' => [
                    'Tidak aktif di Moodle selama 15 hari berturut-turut.',
                    'Ada 1 tugas/kuis yang belum dikumpulkan.',
                ],
                'ai_narration' => "Eko Prasetyo berada pada level risiko TINGGI (87.1%) akibat 15 hari absen dari LMS dan 1 tugas Kimia belum diserahkan. Perlu konfirmasi apakah ada kendala akademik atau kesehatan.",
                'wa_message' => "🚨 *PERINGATAN DINI EWS STIKMAS*\n\nSiswa: *Eko Prasetyo* (Kelas 10-MIPA-1)\nRisiko: *TINGGI (87.1%)*\nMapel: Kimia (EEE)\n\nFaktor: Inaktif 15 hari, 1 tugas belum dikumpulkan.\n\nRekomendasi: Pemanggilan langsung dalam pekan ini.",
                'status' => 'sent',
                'sent_at' => now()->subHours(5),
            ],
            [
                'moodle_student_id' => '305112',
                'student_name' => 'Dina Rahmawati',
                'class_name' => '10-MIPA-2',
                'nis' => null,
                'course_code' => 'DDD (Biologi)',
                'academic_period' => '2026/2027-Ganjil',
                'risk_level' => 'RENDAH',
                'risk_probability' => 0.1550,
                'risk_percentage' => '15.5%',
                'decision_threshold' => 0.40,
                'intervention_urgency' => 'Rendah (aktivitas belajar masih aman dan terkontrol)',
                'moodle_metrics' => [
                    'days_inactive' => 2,
                    'total_clicks' => 380,
                    'active_days' => 28,
                    'missing_assignments' => 0,
                    'tasks_submitted' => 5,
                    'late_submission_count' => 0,
                    'avg_submission_gap' => -2.5,
                    'avg_score' => 89.0,
                    'min_score' => 78.0,
                ],
                'risk_factors' => [
                    'Seluruh indikator aktivitas dan ketuntasan tugas terpantau optimal.',
                ],
                'ai_narration' => "Aktivitas belajar siswa Dina Rahmawati sangat memuaskan dengan frekuensi klik tinggi (380) dan seluruh tugas terkumpul tepat waktu. Status AMAN dan terkontrol.",
                'wa_message' => null,
                'status' => 'ready',
                'sent_at' => null,
            ],
        ];

        foreach ($samples as $data) {
            $studentId = null;
            if (!empty($data['nis'])) {
                $student = Student::where('nis', $data['nis'])->first();
                $studentId = $student?->id;
            }

            $notification = EwsNotification::updateOrCreate(
                [
                    'moodle_student_id' => $data['moodle_student_id'],
                    'course_code' => $data['course_code'],
                    'academic_period' => $data['academic_period'],
                ],
                [
                    'student_id' => $studentId,
                    'student_name' => $data['student_name'],
                    'class_name' => $data['class_name'],
                    'risk_level' => $data['risk_level'],
                    'risk_probability' => $data['risk_probability'],
                    'risk_percentage' => $data['risk_percentage'],
                    'decision_threshold' => $data['decision_threshold'],
                    'intervention_urgency' => $data['intervention_urgency'],
                    'moodle_metrics' => $data['moodle_metrics'],
                    'risk_factors' => $data['risk_factors'],
                    'ai_narration' => $data['ai_narration'],
                    'wa_message' => $data['wa_message'],
                    'audience' => 'guru_bk',
                    'target_user_id' => $counselorId,
                    'target_phone' => $counselorPhone,
                    'status' => $data['status'],
                    'sent_at' => $data['sent_at'],
                ]
            );

            // Jika siswa Citra Lestari, buat 1 riwayat intervensi contoh
            if ($data['moodle_student_id'] === '204551' && $counselorId) {
                EwsIntervention::updateOrCreate(
                    [
                        'notification_id' => $notification->id,
                        'counselor_id' => $counselorId,
                    ],
                    [
                        'intervention_type' => 'KONSELING_INDIVIDU',
                        'action_notes' => 'Siswa dipanggil ke ruang BK untuk konfirmasi kendala keterlambatan tugas Fisika. Diketahui gawai/smartphone siswa sedang rusak sehingga kesulitan mengakses LMS di rumah. Siswa diberikan izin menggunakan fasilitas lab komputer sekolah setiap jam istirahat.',
                        'student_progress' => 'MEMBAIK',
                        'follow_up_date' => now()->addDays(7)->toDateString(),
                    ]
                );
            }
        }
    }
}
