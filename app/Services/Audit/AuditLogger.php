<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    public static function log(User $user, string $action, string $targetResource, string|int $resourceId): AuditLog
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
