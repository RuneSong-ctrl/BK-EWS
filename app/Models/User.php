<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'nip',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isGuruKelas(): bool
    {
        return $this->role === 'guru_kelas';
    }

    public function isGuruBk(): bool
    {
        return $this->role === 'guru_bk';
    }

    public function isKepsek(): bool
    {
        return $this->role === 'kepsek';
    }

    public function classesAsHomeroom(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'homeroom_teacher_id');
    }

    public function createdAcademicRecords(): HasMany
    {
        return $this->hasMany(AcademicRecord::class, 'created_by');
    }

    public function createdAttendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class, 'created_by');
    }

    public function confirmedBehaviorObservations(): HasMany
    {
        return $this->hasMany(BehaviorObservation::class, 'confirmed_by');
    }

    public function handledBkCases(): HasMany
    {
        return $this->hasMany(BkCase::class, 'handled_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }
}
