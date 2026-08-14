<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nis',
        'nisn',
        'name',
        'gender',
        'status',
    ];

    public function enrollments(): HasMany
    {
        return $this->hasMany(ClassEnrollment::class);
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'class_enrollments', 'student_id', 'class_id')
            ->withPivot('academic_year', 'is_current')
            ->withTimestamps();
    }

    public function currentEnrollment(): HasOne
    {
        return $this->hasOne(ClassEnrollment::class)->where('is_current', true);
    }

    public function currentClass(): ?SchoolClass
    {
        return $this->classes()->wherePivot('is_current', true)->first();
    }

    public function academicRecords(): HasMany
    {
        return $this->hasMany(AcademicRecord::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function behaviorObservations(): HasMany
    {
        return $this->hasMany(BehaviorObservation::class);
    }

    public function bkCases(): HasMany
    {
        return $this->hasMany(BkCase::class);
    }

    public function ewsScore(): HasOne
    {
        return $this->hasOne(EwsScore::class);
    }

    public function ewsHistory(): HasMany
    {
        return $this->hasMany(EwsScoreHistory::class);
    }

    public function aiLogs(): HasMany
    {
        return $this->hasMany(AiAnalysisLog::class);
    }
}
