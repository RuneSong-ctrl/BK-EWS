<?php

namespace Tests\Feature;

use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_application_login_page_is_accessible(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_the_root_redirects_to_login_when_unauthenticated(): void
    {
        $response = $this->get('/');

        $response->assertRedirect('/login');
    }

    public function test_unauthenticated_user_is_redirected_to_login(): void
    {
        $response = $this->get('/dashboard');

        $response->assertRedirect('/login');
    }

    public function test_guru_kelas_dashboard_is_accessible(): void
    {
        $response = $this->get('/dashboard/guru-kelas');

        $response->assertStatus(200);
    }

    public function test_guru_bk_dashboard_is_accessible(): void
    {
        $response = $this->get('/dashboard/guru-bk');

        $response->assertStatus(200);
    }

    public function test_kepsek_dashboard_is_accessible(): void
    {
        $response = $this->get('/dashboard/kepsek');

        $response->assertStatus(200);
    }

    public function test_student_profile_is_accessible(): void
    {
        $student = Student::create([
            'nis' => '1001',
            'nisn' => '0012345678',
            'name' => 'Ahmad Fadhil',
            'gender' => 'L',
            'status' => 'AKTIF',
        ]);

        $response = $this->get("/students/{$student->id}");

        $response->assertStatus(200);
    }
}

