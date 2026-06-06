<?php

namespace Tests\Feature;

use App\Conversations\Actions\TicketEventLogger;
use App\Conversations\Events\ConversationCreated;
use App\Conversations\Events\ConversationMessageCreated;
use App\Conversations\Events\ConversationsUpdated;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use App\Conversations\Models\ConversationStatus;
use App\Conversations\Models\TicketEventLog;
use App\Models\User;
use Common\Auth\Permissions\Permission;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TicketMilestonesSidebarDataTest extends TestCase
{
    use DatabaseTransactions;

    public function test_dashboard_sidebar_milestones_endpoint_goes_through_full_ticket_lifecycle(): void
    {
        $createdAt = Carbon::parse('2026-05-19 09:00:00');
        $handoffAt = $createdAt->copy()->addMinutes(8);
        $assignedAt = $createdAt->copy()->addMinutes(10);
        $firstReplyAt = $handoffAt->copy()->addMinutes(143);
        $closedAt = $createdAt->copy()->addHours(4);

        $customer = $this->createCustomer('Milestone Customer');
        $assignedAgent = $this->createAgent('Support One');
        $replyAgent = $this->createAgent('Support Two');
        $conversation = $this->createTicket($createdAt, $customer);
        $dashboardUser = $this->createDashboardUser();
        $logger = app(TicketEventLogger::class);

        event(new ConversationCreated($conversation));
        $logger->logNeedHumanSupport(
            conversation: $conversation,
            metadata: ['tag' => 'need-human-support'],
            createdAt: $handoffAt,
        );

        $assignedEvent = new ConversationsUpdated([$conversation]);
        $conversation->forceFill([
            'assigned_to' => Conversation::ASSIGNED_AGENT,
            'assignee_id' => $assignedAgent->id,
            'assigned_at' => $assignedAt,
        ])->save();
        $assignedEvent->dispatch([$conversation->refresh()]);

        $firstReply = ConversationItem::create([
            'conversation_id' => $conversation->id,
            'user_id' => $replyAgent->id,
            'author' => Conversation::AUTHOR_AGENT,
            'type' => 'message',
            'body' => 'We are checking this for you.',
            'created_at' => $firstReplyAt,
            'updated_at' => $firstReplyAt,
        ]);
        event(new ConversationMessageCreated($conversation, $firstReply));

        $closedStatus = ConversationStatus::create([
            'label' => 'Closed',
            'user_label' => 'Closed',
            'category' => Conversation::STATUS_CLOSED,
            'active' => true,
            'internal' => true,
        ]);
        $closedEvent = new ConversationsUpdated([$conversation->refresh()]);
        $conversation
            ->forceFill([
                'status_id' => $closedStatus->id,
                'status_category' => $closedStatus->category,
                'closed_by' => $assignedAgent->id,
                'closed_at' => $closedAt,
            ])
            ->save();
        $closedEvent->dispatch([$conversation->refresh()]);

        $response = $this
            ->actingAs($dashboardUser, 'sanctum')
            ->getJson("api/v1/admin/tickets/{$conversation->id}/milestones");

        $response->assertOk()->assertJsonPath('status', 'success');

        $result = $response->json();
        $timeline = collect($result['timeline']);

        $this->assertSame(
            [
                TicketEventLog::EVENT_CREATED,
                TicketEventLog::EVENT_NEED_HUMAN_SUPPORT,
                TicketEventLog::EVENT_ASSIGNED,
                TicketEventLog::EVENT_FIRST_REPLY,
                TicketEventLog::EVENT_CLOSED,
            ],
            $timeline->pluck('event_type')->all(),
        );

        $this->assertSame(
            [
                'Ticket created',
                'Need human support',
                'Ticket assigned',
                'First agent reply',
                'Ticket closed',
            ],
            $timeline
                ->pluck('event_type')
                ->map(fn(string $eventType) => $this->sidebarLabel($eventType))
                ->all(),
        );

        $this->assertSame(
            [
                $customer->id,
                null,
                $assignedAgent->id,
                $replyAgent->id,
                $assignedAgent->id,
            ],
            $timeline->pluck('actor_id')->all(),
        );

        $this->assertSame(
            [
                'customer',
                'system',
                'human',
                'human',
                'human',
            ],
            $timeline->pluck('actor_type')->all(),
        );

        $this->assertSame(
            [$assignedAgent->id, $replyAgent->id],
            collect($result['metrics']['agents_involved'])->pluck('id')->all(),
        );
        $this->assertSame(
            143 * 60,
            $result['metrics']['idle_before_first_reply_seconds'],
        );
        $this->assertSame(
            151 * 60,
            $result['metrics']['time_to_first_reply_seconds'],
        );
        $this->assertSame(
            240 * 60,
            $result['metrics']['resolution_time_seconds'],
        );
    }

    private function createDashboardUser(): User
    {
        $user = User::create([
            'name' => 'Dashboard Milestone Viewer',
            'email' => 'dashboard-viewer-'.
                str_replace('.', '', uniqid('', true)).
                '@example.test',
            'password' => 'password',
            'type' => 'agent',
            'email_verified_at' => now(),
        ]);

        $permissionIds = collect(['reports.view', 'api.access'])
            ->map(
                fn(string $name) => Permission::firstOrCreate(
                    ['name' => $name],
                    ['group' => 'reports', 'type' => 'users'],
                )->id,
            )
            ->all();

        $user->permissions()->syncWithoutDetaching($permissionIds);
        $user->load('permissions');

        return $user;
    }

    private function createCustomer(string $name): User
    {
        return User::create([
            'name' => $name,
            'email' => strtolower(str_replace(' ', '.', $name)).
                '-'.str_replace('.', '', uniqid('', true)).'@example.test',
            'password' => 'password',
            'type' => 'customer',
        ]);
    }

    private function createAgent(string $name): User
    {
        return User::create([
            'name' => $name,
            'email' => strtolower(str_replace(' ', '.', $name)).
                '-'.str_replace('.', '', uniqid('', true)).'@example.test',
            'password' => 'password',
            'type' => 'agent',
        ]);
    }

    private function createTicket(Carbon $createdAt, User $customer): Conversation
    {
        $status = ConversationStatus::create([
            'label' => 'Open',
            'user_label' => 'Open',
            'category' => Conversation::STATUS_OPEN,
            'active' => true,
            'internal' => true,
        ]);

        return Conversation::create([
            'subject' => 'Sidebar milestone simulation',
            'type' => 'ticket',
            'user_id' => $customer->id,
            'status_id' => $status->id,
            'channel' => 'widget',
            'mode' => Conversation::MODE_NORMAL,
            'assigned_to' => Conversation::ASSIGNED_BOT,
            'status_category' => $status->category,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    private function sidebarLabel(string $eventType): string
    {
        return match ($eventType) {
            TicketEventLog::EVENT_CREATED => 'Ticket created',
            TicketEventLog::EVENT_NEED_HUMAN_SUPPORT => 'Need human support',
            TicketEventLog::EVENT_ASSIGNED => 'Ticket assigned',
            TicketEventLog::EVENT_FIRST_REPLY => 'First agent reply',
            TicketEventLog::EVENT_CLOSED => 'Ticket closed',
            TicketEventLog::EVENT_REOPENED => 'Ticket reopened',
        };
    }
}
