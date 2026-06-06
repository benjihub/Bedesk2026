<?php

namespace Tests\Feature;

use Tests\TestCase;

class LineWebhookTest extends TestCase
{
    public function test_webhook_calls_service_and_returns_response()
    {
        $this->app->instance(\App\Features\Line\Application\Services\LineWebhookService::class, new class {
            public function handle($request) {
                return ['accepted' => true, 'signature_valid' => true];
            }
        });

        $response = $this->postJson('/api/line/webhook', ['events' => []]);

        $response->assertStatus(200)->assertJson(['accepted' => true, 'signature_valid' => true]);
    }
}
