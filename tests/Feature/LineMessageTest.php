<?php

namespace Tests\Feature;

use Tests\TestCase;

class LineMessageTest extends TestCase
{
    public function test_send_endpoint_calls_service_and_returns_record_id()
    {
        $this->app->instance(\App\Features\Line\Application\Services\LineMessageService::class, new class {
            public function sendMessage($outgoing) {
                return (object) ['id' => 123];
            }
        });

        $payload = [
            'to' => 'U123456',
            'type' => 'text',
            'body' => 'Hello from test',
        ];

        $response = $this->postJson('/api/line/messages', $payload);

        $response->assertStatus(200)->assertJson(['success' => true, 'record_id' => 123]);
    }
}
