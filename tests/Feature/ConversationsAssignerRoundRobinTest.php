<?php

namespace Tests\Feature;

use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Models\User;
use App\Team\Models\Group;
use App\Team\Models\GroupRotationState;
use Common\Auth\UserSession;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ConversationsAssignerRoundRobinTest extends TestCase
{
    use DatabaseTransactions;

    public function test_cs1_and_cs2_receive_tickets_round_robin_until_capacity_then_queue(): void
    {
        [$group, $status, $cs1, $cs2] = $this->createAssignmentFixture(
            assignmentLimit: 5,
        );

        $assignedAgentIds = [];

        foreach (range(1, 15) as $ticketNumber) {
            $conversation = $this->createOpenTicket($group, $status, $ticketNumber);

            $assigned = ConversationsAssigner::assignConversationToFirstAvailableAgent(
                $conversation,
            );

            $assignedAgentIds[] = $assigned->assignee_id;
        }

        $this->assertSame(
            [
                $cs1->id,
                $cs2->id,
                $cs1->id,
                $cs2->id,
                $cs1->id,
                $cs2->id,
                $cs1->id,
                $cs2->id,
                $cs1->id,
                $cs2->id,
                null,
                null,
                null,
                null,
                null,
            ],
            $assignedAgentIds,
        );

        $this->assertSame(5, $this->activeTicketCountFor($cs1));
        $this->assertSame(5, $this->activeTicketCountFor($cs2));
        $this->assertSame(5, $this->queuedTicketCountFor($group));
    }

    public function test_queued_ticket_is_assigned_when_an_agent_capacity_opens(): void
    {
        [$group, $status, $cs1, $cs2] = $this->createAssignmentFixture(
            assignmentLimit: 1,
        );

        $firstTicket = ConversationsAssigner::assignConversationToFirstAvailableAgent(
            $this->createOpenTicket($group, $status, 1),
        );
        $secondTicket = ConversationsAssigner::assignConversationToFirstAvailableAgent(
            $this->createOpenTicket($group, $status, 2),
        );
        $queuedTicket = ConversationsAssigner::assignConversationToFirstAvailableAgent(
            $this->createOpenTicket($group, $status, 3),
        );

        $this->assertSame($cs1->id, $firstTicket->assignee_id);
        $this->assertSame($cs2->id, $secondTicket->assignee_id);
        $this->assertNull($queuedTicket->assignee_id);
        $this->assertSame(1, $this->queuedTicketCountFor($group));

        $firstTicket->update([
            'status_category' => Conversation::STATUS_CLOSED,
            'closed_at' => now(),
        ]);

        $assignedFromQueue = ConversationsAssigner::drainQueueIfNeeded($group->id);

        $this->assertCount(1, $assignedFromQueue);
        $this->assertSame($cs1->id, $queuedTicket->refresh()->assignee_id);
        $this->assertSame(0, $this->queuedTicketCountFor($group));
    }

    private function createAssignmentFixture(int $assignmentLimit): array
    {
        $status = ConversationStatus::create([
            'label' => 'Open',
            'user_label' => 'In progress',
            'category' => Conversation::STATUS_OPEN,
            'active' => true,
            'internal' => true,
        ]);

        $group = Group::create([
            'name' => 'Human Support',
            'default' => true,
            'assignment_mode' => 'auto',
        ]);

        $suffix = str_replace('.', '', uniqid('', true));
        $cs1 = $this->createActiveAgent('CS1', "cs1-{$suffix}@example.test", $assignmentLimit);
        $cs2 = $this->createActiveAgent('CS2', "cs2-{$suffix}@example.test", $assignmentLimit);

        DB::table('group_user')->insert([
            [
                'group_id' => $group->id,
                'user_id' => $cs1->id,
                'conversation_priority' => 'primary',
                'created_at' => now()->subSeconds(2),
            ],
            [
                'group_id' => $group->id,
                'user_id' => $cs2->id,
                'conversation_priority' => 'primary',
                'created_at' => now()->subSecond(),
            ],
        ]);

        GroupRotationState::create([
            'group_id' => $group->id,
            'current_agent_index' => 0,
        ]);

        return [$group, $status, $cs1, $cs2];
    }

    private function createActiveAgent(
        string $name,
        string $email,
        int $assignmentLimit,
    ): User {
        $agent = User::create([
            'name' => $name,
            'email' => $email,
            'password' => 'password',
            'type' => 'agent',
        ]);

        $agent->agentSettings()->create([
            'assignment_limit' => $assignmentLimit,
            'accepts_conversations' => 'yes',
            'working_hours' => null,
        ]);

        UserSession::create([
            'user_id' => $agent->id,
            'ip_address' => '127.0.0.1',
            'country' => 'ug',
            'city' => 'Kampala',
            'platform' => 'test',
            'device' => 'desktop',
            'browser' => 'test',
            'user_agent' => 'PHPUnit',
            'session_id' => strtolower($name).'-session',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $agent;
    }

    private function createOpenTicket(
        Group $group,
        ConversationStatus $status,
        int $ticketNumber,
    ): Conversation {
        return Conversation::create([
            'subject' => "Functional test ticket {$ticketNumber}",
            'type' => 'ticket',
            'status_id' => $status->id,
            'status_category' => $status->category,
            'priority' => 2,
            'assigned_to' => Conversation::ASSIGNED_AGENT,
            'assignee_id' => null,
            'group_id' => $group->id,
            'channel' => 'widget',
            'mode' => Conversation::MODE_NORMAL,
        ]);
    }

    private function activeTicketCountFor(User $agent): int
    {
        return Conversation::query()
            ->whereNotClosed()
            ->where('type', 'ticket')
            ->where('assigned_to', Conversation::ASSIGNED_AGENT)
            ->where('assignee_id', $agent->id)
            ->count();
    }

    private function queuedTicketCountFor(Group $group): int
    {
        return Conversation::query()
            ->whereNotClosed()
            ->where('type', 'ticket')
            ->where('assigned_to', Conversation::ASSIGNED_AGENT)
            ->whereNull('assignee_id')
            ->where('group_id', $group->id)
            ->count();
    }
}
