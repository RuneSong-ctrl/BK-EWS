<?php

namespace Tests\Feature;

use App\Models\EwsNotification;
use App\Models\EwsTelegramRecipient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TelegramGatewayTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.ews.api_key' => 'test-key']);
    }

    private function api(): static
    {
        return $this->withHeader('X-EWS-Key', 'test-key');
    }

    private function queue(string $name = 'Guru A', array $attrs = []): EwsNotification
    {
        return EwsNotification::create(array_merge([
            'recipient_type' => 'guru_mapel', 'recipient_name' => $name, 'recipient_phone' => '-',
            'risk_level' => 'TINGGI', 'message_type' => 'ai_generated', 'message_text' => 'Pesan',
            'status' => 'pending', 'scheduled_at' => now(),
        ], $attrs));
    }

    public function test_machine_routes_require_key_and_fail_closed(): void
    {
        $this->getJson('/api/ews/notifications/pending')->assertUnauthorized();
        $this->withHeader('X-EWS-Key', 'salah')->postJson('/api/ews/tier1/alerts', [])->assertUnauthorized();
        config(['services.ews.api_key' => '']);
        $this->getJson('/api/ews/notifications/pending')->assertStatus(503);
    }

    public function test_link_then_only_linked_recipients_are_claimed_with_chat_id(): void
    {
        $rec = EwsTelegramRecipient::forName('Guru A');
        EwsTelegramRecipient::forName('Guru B');
        $this->api()->postJson('/api/ews/telegram/link', ['token' => 'salah', 'chat_id' => '1'])->assertNotFound();
        $this->api()->postJson('/api/ews/telegram/link', ['token' => $rec->link_token, 'chat_id' => '777'])
            ->assertOk()->assertJson(['recipient_name' => 'Guru A']);

        $a = $this->queue('Guru A');
        $b = $this->queue('Guru B');
        $future = $this->queue('Guru A', ['scheduled_at' => now()->addDay()]);

        $data = $this->api()->getJson('/api/ews/notifications/pending')->assertOk()->json('data');
        $this->assertSame([$a->id], array_column($data, 'id'));
        $this->assertSame('777', $data[0]['telegram_chat_id']);
        $this->assertSame('pending', $b->fresh()->status);
        $this->assertSame('pending', $future->fresh()->status);
        $this->assertCount(0, $this->api()->getJson('/api/ews/notifications/pending')->json('data'));

        $this->api()->patchJson("/api/ews/notifications/{$a->id}/status", ['status' => 'sent'])->assertOk();
        $this->assertNotNull($a->fresh()->sent_at);
    }

    public function test_pipeline_digest_is_queued_without_hardcoded_fallback_number(): void
    {
        $this->api()->postJson('/api/ews/tier1/alerts', [
            'tier1_subject_teacher' => [],
            'digests' => [['guru_pengampu' => 'Guru A', 'nama_mapel' => 'Web', 'risk_level' => 'SEDANG', 'wa_message' => 'Rekap']],
        ])->assertOk()->assertJsonPath('counts.digests', 1);

        $this->assertDatabaseHas('ews_notifications', [
            'recipient_name' => 'Guru A', 'risk_level' => 'SEDANG', 'recipient_phone' => '-', 'status' => 'pending',
        ]);
    }

    public function test_rerun_pipeline_keeps_teacher_and_bk_follow_up_status(): void
    {
        $alert = ['id_siswa' => 99, 'nama_siswa' => 'Siswa Uji',
            'mata_pelajaran' => ['kode_modul' => 'AAA'], 'analisis_risiko' => ['tingkat_risiko' => 'TINGGI']];
        $summary = ['id_siswa' => 99, 'prioritas_konseling' => 'TINGGI'];

        $this->api()->postJson('/api/ews/tier1/alerts', ['tier1_subject_teacher' => [$alert]])->assertOk();
        $this->api()->postJson('/api/ews/tier2/summaries', ['tier2_counselor_bk' => [$summary]])->assertOk();
        $this->assertDatabaseHas('ews_student_summaries', ['status_penanganan' => 'in_counseling']);

        \App\Models\EwsCourseAlert::query()->update(['status' => 'remedial']);
        \App\Models\EwsStudentSummary::query()->update(['status_penanganan' => 'resolved']);
        $this->api()->postJson('/api/ews/tier1/alerts', ['tier1_subject_teacher' => [$alert]])->assertOk();
        $this->api()->postJson('/api/ews/tier2/summaries', ['tier2_counselor_bk' => [$summary]])->assertOk();

        $this->assertDatabaseHas('ews_course_alerts', ['status' => 'remedial']);
        $this->assertDatabaseHas('ews_student_summaries', ['status_penanganan' => 'resolved']);
    }

    public function test_admin_test_send_targets_selected_telegram_recipient(): void
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        EwsTelegramRecipient::forName('Guru A')->update(['chat_id' => '777']);

        $this->actingAs($admin)->post('/admin/notifications/test-send', [
            'recipient_type' => 'guru_mapel', 'recipient_name' => 'Tidak Ada',
        ])->assertSessionHasErrors('recipient_name');

        $this->actingAs($admin)->post('/admin/notifications/test-send', [
            'recipient_type' => 'guru_mapel', 'recipient_name' => 'Guru A',
        ])->assertSessionHasNoErrors();

        $data = $this->api()->getJson('/api/ews/notifications/pending')->json('data');
        $this->assertSame('Guru A', $data[0]['recipient_name']);
        $this->assertSame('777', $data[0]['telegram_chat_id']);
    }

    public function test_admin_test_send_uses_recipients_own_alert_or_labels_foreign_sample(): void
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        $alert = fn (string $nis, string $guru) => ['id_siswa' => $nis, 'nama_siswa' => "Siswa {$nis}",
            'mata_pelajaran' => ['kode_modul' => "M{$nis}", 'guru_pengampu' => $guru], 'analisis_risiko' => ['tingkat_risiko' => 'TINGGI']];
        $this->api()->postJson('/api/ews/tier1/alerts', ['tier1_subject_teacher' => [$alert('1', 'Guru A'), $alert('2', 'Guru B')]]);
        EwsTelegramRecipient::forName('Guru A');
        EwsTelegramRecipient::forName('Admin Uji Coba');

        $this->actingAs($admin)->post('/admin/notifications/test-send', ['recipient_type' => 'guru_mapel', 'recipient_name' => 'Guru A']);
        $own = EwsNotification::where('recipient_name', 'Guru A')->first();
        $this->assertStringContainsString('Guru A', $own->message_text);
        $this->assertStringNotContainsString('UJI COBA* untuk', $own->message_text);

        $this->actingAs($admin)->post('/admin/notifications/test-send', ['recipient_type' => 'guru_mapel', 'recipient_name' => 'Admin Uji Coba']);
        $foreign = EwsNotification::where('recipient_name', 'Admin Uji Coba')->first();
        $this->assertStringStartsWith('🧪 *UJI COBA* untuk Admin Uji Coba (contoh data milik Guru ', $foreign->message_text);
    }
}
