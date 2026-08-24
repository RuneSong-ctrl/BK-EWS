<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Request;

/**
 * Service: AuditLogger
 * 
 * Pencatat Jejak Audit (Immutable Audit Trail) untuk setiap aksi sensitif pada sistem.
 * Merekam aktivitas akses lembar pantau siswa, penanganan kasus BK, dan disposisi pimpinan.
 */
class AuditLogger
{
    /**
     * Catat entri aktivitas audit trail ke database
     *
     * @param User $user Pengguna yang melakukan aksi
     * @param string $action Nama aksi (misal: 'VIEW_STUDENT_EWS_MONITOR', 'KEPSEK_DISPOSITION_SUBMITTED')
     * @param string $targetResource Nama tabel / resource entitas target
     * @param string|int $resourceId ID entitas terkait
     * @param array|null $metadata Data kontekstual tambahan
     * @return AuditLog Model entri log audit yang tersimpan
     */
    public static function log(User $user, string $action, string $targetResource, string|int $resourceId, ?array $metadata = null): AuditLog
    {
        return AuditLog::create([
            'user_id' => $user->id,
            'action' => $action,
            'target_resource' => $targetResource,
            'resource_id' => (string) $resourceId,
            'ip_address' => Request::ip() ?? '127.0.0.1',
            'user_agent' => Request::userAgent() ?? 'Unknown',
            'created_at' => Carbon::now(),
        ]);
    }
}

