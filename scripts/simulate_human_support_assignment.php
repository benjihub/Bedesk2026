<?php

use Ai\AiAgent\Models\AiAgentSession;
use App\Conversations\Agent\Actions\ConversationsAssigner;
use App\Conversations\Messages\CreateConversationMessage;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Models\User;
use App\Team\Models\AgentSettings;
use App\Team\Models\Group;
use App\Team\Models\GroupRotationState;
use Common\Auth\UserSession;
use Common\Tags\Tag;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$ticketCount = (int) ($argv[1] ?? 15);
$assignmentLimit = (int) ($argv[2] ?? 5);
$subjectPrefix = 'Human Support Simulation';

if ($ticketCount < 1) {
    throw new InvalidArgumentException('Ticket count must be at least 1.');
}

$status = ConversationStatus::getDefaultOpen();
if (!$status) {
    $status = ConversationStatus::create([
        'label' => 'Open',
        'user_label' => 'In progress',
        'category' => Conversation::STATUS_OPEN,
        'active' => true,
        'internal' => true,
    ]);
}

$group = Group::firstOrCreate(
    ['name' => 'Human Support Simulation'],
    [
        'default' => false,
        'assignment_mode' => 'auto',
    ],
);
$group->forceFill(['assignment_mode' => 'auto'])->save();

$cs1 = createOrUpdateAgent('CS1', 'cs1@example.test', $assignmentLimit);
$cs2 = createOrUpdateAgent('CS2', 'cs2@example.test', $assignmentLimit);

DB::table('group_user')
    ->where('group_id', $group->id)
    ->whereIn('user_id', [$cs1->id, $cs2->id])
    ->delete();

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

GroupRotationState::query()->updateOrCreate(
    ['group_id' => $group->id],
    ['current_agent_index' => 0],
);

Conversation::query()
    ->where('subject', 'like', "{$subjectPrefix}%")
    ->where('status_category', '>', Conversation::STATUS_CLOSED)
    ->update([
        'status_category' => Conversation::STATUS_CLOSED,
        'closed_at' => now(),
        'assignee_id' => null,
    ]);

$tag = Tag::firstOrCreate(
    ['name' => 'need-human-support'],
    [
        'display_name' => 'Need human support',
        'type' => 'custom',
    ],
);

$results = [];

foreach (range(1, $ticketCount) as $ticketNumber) {
    $customer = User::create([
        'name' => "Simulation Customer {$ticketNumber}",
        'email' => 'simulation-customer-'.$ticketNumber.'-'.time().'@example.test',
        'password' => 'password',
        'type' => 'user',
    ]);

    $conversation = $customer->conversations()->create([
        'subject' => "{$subjectPrefix} #{$ticketNumber}",
        'type' => 'ticket',
        'status_id' => $status->id,
        'status_category' => $status->category,
        'priority' => 2,
        'group_id' => $group->id,
        'channel' => 'widget',
        'assigned_to' => Conversation::ASSIGNED_BOT,
        'assignee_id' => null,
        'ai_agent_involved' => true,
        'mode' => Conversation::MODE_NORMAL,
        'request_ip' => '127.0.0.1',
    ]);

    (new CreateConversationMessage())->execute($conversation, [
        'type' => 'message',
        'author' => Conversation::AUTHOR_USER,
        'body' => "Ticket {$ticketNumber}: saya butuh bantuan manusia untuk cek deposit saya, user id SIM{$ticketNumber}.",
    ]);

    (new CreateConversationMessage())->execute($conversation, [
        'type' => 'message',
        'author' => Conversation::AUTHOR_BOT,
        'body' => 'Mohon tunggu sebentar ya, saya teruskan ke tim CS manusia untuk dicek.',
        'data' => [
            'ai_group_reply' => [
                'reply' => 'Mohon tunggu sebentar ya, saya teruskan ke tim CS manusia untuk dicek.',
                'intent' => 'processing',
                'status' => 'processing',
                'context' => [
                    'processing' => true,
                    'awaitingUserId' => false,
                    'userId' => "SIM{$ticketNumber}",
                    'userIdFlowType' => 'deposit',
                ],
            ],
        ],
    ]);

    AiAgentSession::updateOrCreate(
        ['conversation_id' => $conversation->id],
        [
            'status' => AiAgentSession::STATUS_ACTIVE,
            'context' => [
                'support_handoff_active' => true,
                'support_handoff_intent' => 'processing',
                'support_handoff_user_id' => "SIM{$ticketNumber}",
                'support_handoff_started_at' => now()->toISOString(),
            ],
        ],
    );

    DB::table('taggables')->updateOrInsert(
        [
            'tag_id' => $tag->id,
            'taggable_id' => $conversation->id,
            'taggable_type' => Conversation::MODEL_TYPE,
            'user_id' => null,
        ],
        [],
    );

    $assigned = ConversationsAssigner::assignConversationToFirstAvailableAgent(
        $conversation->refresh(),
        addEvent: true,
    )->refresh();

    $results[] = [
        'ticket' => $ticketNumber,
        'conversation_id' => $assigned->id,
        'assignee' => $assigned->assignee?->name ?? 'QUEUE',
        'assignee_id' => $assigned->assignee_id,
    ];
}

$cs1Count = activeSimulationCountFor($cs1, $subjectPrefix);
$cs2Count = activeSimulationCountFor($cs2, $subjectPrefix);
$queueCount = Conversation::query()
    ->where('subject', 'like', "{$subjectPrefix}%")
    ->whereNotClosed()
    ->where('group_id', $group->id)
    ->whereNull('assignee_id')
    ->count();

echo PHP_EOL;
echo "Human support simulation complete." . PHP_EOL;
echo "Group: {$group->name} (#{$group->id})" . PHP_EOL;
echo "Agents: CS1 #{$cs1->id}, CS2 #{$cs2->id}" . PHP_EOL;
echo "Assignment limit per agent: {$assignmentLimit}" . PHP_EOL;
echo PHP_EOL;

foreach ($results as $result) {
    echo sprintf(
        "Ticket %02d / conversation #%d -> %s%s",
        $result['ticket'],
        $result['conversation_id'],
        $result['assignee'],
        PHP_EOL,
    );
}

echo PHP_EOL;
echo "Final active simulation state:" . PHP_EOL;
echo "CS1: {$cs1Count}" . PHP_EOL;
echo "CS2: {$cs2Count}" . PHP_EOL;
echo "Queue: {$queueCount}" . PHP_EOL;
echo PHP_EOL;

function createOrUpdateAgent(
    string $name,
    string $email,
    int $assignmentLimit,
): User {
    $agent = User::query()->updateOrCreate(
        ['email' => $email],
        [
            'name' => $name,
            'password' => 'password',
            'type' => 'agent',
            'banned_at' => null,
        ],
    );

    AgentSettings::query()->updateOrCreate(
        ['user_id' => $agent->id],
        [
            'assignment_limit' => $assignmentLimit,
            'accepts_conversations' => 'yes',
            'working_hours' => null,
        ],
    );

    UserSession::query()->updateOrCreate(
        [
            'user_id' => $agent->id,
            'session_id' => strtolower($name).'-simulation-session',
        ],
        [
            'ip_address' => '127.0.0.1',
            'country' => 'ug',
            'city' => 'Kampala',
            'platform' => 'simulation',
            'device' => 'desktop',
            'browser' => 'simulation',
            'user_agent' => 'human-support-simulation',
            'updated_at' => now(),
            'created_at' => now(),
        ],
    );

    return $agent->fresh(['agentSettings', 'latestUserSession']);
}

function activeSimulationCountFor(User $agent, string $subjectPrefix): int
{
    return Conversation::query()
        ->where('subject', 'like', "{$subjectPrefix}%")
        ->whereNotClosed()
        ->where('assigned_to', Conversation::ASSIGNED_AGENT)
        ->where('assignee_id', $agent->id)
        ->count();
}
