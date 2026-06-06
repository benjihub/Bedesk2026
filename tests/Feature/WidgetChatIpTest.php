<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livechat\Chats\CreateChatAsCustomer;
use App\Conversations\Agent\Actions\FullConversationLoader;
use Tests\TestCase;

class WidgetChatIpTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A widget chat should save the request IP and it should be exposed
     * through the full conversation loader (the same path used by the
     * admin UI).
     */
    public function test_ip_address_saved_and_exposed_when_creating_widget_chat()
    {
        // pick a sample public non-private IP so getIp() will happily return
        $ip = '203.0.113.42';

        // create a regular user and authenticate using the chatWidget guard
        $user = User::factory()->create();
        $this->actingAs($user, 'chatWidget');

        // ensure the request helper will return our fake IP
        $this->withServerVariables(['REMOTE_ADDR' => $ip]);

        // execute the action directly instead of hitting the streaming
        // controller endpoint (simpler for testing).
        $conversation = (new CreateChatAsCustomer())->execute([
            // minimal payload required by the action
            'message' => ['body' => 'hello'],
        ]);

        // conversation record should have the ip in request_ip column
        $this->assertDatabaseHas('conversations', [
            'id' => $conversation->id,
            'request_ip' => $ip,
        ]);

        // loader should return the same ip via session->ip_address
        $data = (new FullConversationLoader())->loadData($conversation);
        $this->assertArrayHasKey('session', $data);
        $this->assertEquals($ip, $data['session']['ip_address']);

        // if session record somehow ends up with an empty string we should
        // still fall back to the request_ip value (previously frontend
        // would've hidden the field because empty string is falsy).
        $conversation->user->latestUserSession->update(['ip_address' => '']);
        $data2 = (new FullConversationLoader())->loadData($conversation);
        $this->assertEquals($ip, $data2['session']['ip_address']);
    }

    /**
     * When there is no user session record at all, we should still send the
     * IP that was saved directly on the conversation. This mimics the
     * behaviour for older tickets or chats created before sessions were
     * recorded.
     */
    public function test_loader_prefers_request_ip_if_session_missing()
    {
        $ip = '198.51.100.17';
        $user = User::factory()->create();

        // create a conversation manually with a request_ip value and ensure
        // the user has no sessions afterwards.
        $status = \App\Conversations\Models\ConversationStatus::getDefaultOpen();
        $conversation = $user->conversations()->create([
            'type' => 'ticket',
            'status_id' => $status->id,
            'status_category' => $status->category,
            'group_id' => 1,
            'channel' => 'widget',
            'request_ip' => $ip,
        ]);

        // remove any sessions that might have been created implicitly
        \Common\Auth\UserSession::where('user_id', $user->id)->delete();

        $data = (new FullConversationLoader())->loadData($conversation);
        $this->assertEquals($ip, $data['session']['ip_address']);
    }
}
