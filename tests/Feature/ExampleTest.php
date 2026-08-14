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

    public function test_user_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Ibu Siti Aminah',
            'nip' => '198803202012022003',
            'email' => 'siti.aminah@sekolah.sch.id',
            'role' => 'guru_kelas',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();
    }

    public function test_user_can_login_with_nip(): void
    {
        $user = \App\Models\User::create([
            'name' => 'Pak Budi Pratama',
            'nip' => '198907122014021003',
            'email' => 'budi.bk@sekolah.sch.id',
            'role' => 'guru_bk',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
        ]);

        $response = $this->post('/login', [
            'identifier' => '198907122014021003',
            'password' => 'password123',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_user_can_login_with_email(): void
    {
        $user = \App\Models\User::create([
            'name' => 'Kepsek Hartono',
            'nip' => '197005121995031002',
            'email' => 'kepsek@sekolah.sch.id',
            'role' => 'kepsek',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
        ]);

        $response = $this->post('/login', [
            'identifier' => 'kepsek@sekolah.sch.id',
            'password' => 'password123',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = \App\Models\User::create([
            'name' => 'Test User',
            'nip' => '199999999999999999',
            'email' => 'test@sekolah.sch.id',
            'role' => 'guru_kelas',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
        ]);

        $response = $this->actingAs($user)->post('/logout');

        $response->assertRedirect('/login');
        $this->assertGuest();
    }
}


