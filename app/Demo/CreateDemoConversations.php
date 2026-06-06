<?php

namespace App\Demo;

use App\Attributes\Models\CustomAttribute;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationStatus;
use App\Models\User;
use App\Team\Models\Group;
use Carbon\Carbon;
use Faker\Generator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CreateDemoConversations
{
    protected Collection $customers;
    protected Collection $agents;
    protected Collection $groups;
    protected Collection $statuses;
    protected Collection $subjects;
    protected Generator $faker;

    public function __construct()
    {
        $this->customers = User::where('type', 'user')->get();
        $this->agents = User::where('type', 'agent')->get();
        $this->groups = Group::with('users')->get();
        $this->statuses = ConversationStatus::all();
        $this->subjects = collect(
            json_decode(
                file_get_contents(
                    base_path('resources/demo/tickets/subjects.json'),
                ),
                true,
            ),
        )->flatten(1);
        $this->faker = app(Generator::class);
    }

    public function execute()
    {
        $mainAgent = $this->agents->where('email', 'agent@demo.com')->first();
        $mainAdmin = $this->agents->where('email', 'admin@admin.com')->first();
        $defaultGroup = $this->groups->where('default', true)->first();

        $data = [];

        // active chats - 4 for main agent, 4 for main admin
        for ($i = 0; $i < 8; $i++) {
            $assignee = $i < 4 ? $mainAgent : $mainAdmin;
            $data[] = $this->getConversationData([
                'type' => 'chat',
                'category' => Conversation::STATUS_OPEN,
                'assignee_id' => $assignee->id,
            ]);
        }

        // active tickets - 4 for main agent, 4 for main admin
        for ($i = 0; $i < 8; $i++) {
            $assignee = $i < 4 ? $mainAgent : $mainAdmin;
            $data[] = $this->getConversationData([
                'type' => 'ticket',
                'category' => $this->faker->boolean(60)
                    ? Conversation::STATUS_OPEN
                    : Conversation::STATUS_PENDING,
                'assignee_id' => $assignee->id,
            ]);
        }

        // unnassigned chats
        for ($i = 0; $i < 6; $i++) {
            $data[] = $this->getConversationData([
                'type' => 'chat',
                'category' => Conversation::STATUS_OPEN,
                'assignee_id' => null,
                'group_id' => $defaultGroup->id,
            ]);
        }

        // unnassigned tickets
        for ($i = 0; $i < 12; $i++) {
            $data[] = $this->getConversationData([
                'type' => 'ticket',
                'category' => Conversation::STATUS_OPEN,
                'assignee_id' => null,
                'group_id' => $this->groups->random()->id,
            ]);
        }

        // closed chats
        for ($i = 0; $i < 32; $i++) {
            $agent = mt_rand(1, 100) <= 70 ? $this->agents->random() : null;
            $data[] = $this->getConversationData([
                'type' => 'chat',
                'category' => Conversation::STATUS_CLOSED,
                'assignee_id' => $agent?->id,
            ]);
        }

        // closed tickets
        for ($i = 0; $i < 64; $i++) {
            $agent = $this->agents->random();
            $data[] = $this->getConversationData([
                'type' => 'ticket',
                'category' => Conversation::STATUS_CLOSED,
                'assignee_id' => $agent->id,
            ]);
        }

        Conversation::insert($data);

        $this->attachCategoryToConversations();
    }

    protected function getConversationData(array $config)
    {
        $type = $config['type'];
        $statusCategory = $config['category'];
        $date =
            $type === 'chat'
                ? $this->faker->dateTimeBetween(
                    now()->subMinutes(120),
                    now()->subMinutes(60),
                )
                : $this->faker->dateTimeBetween(
                    now()->subDays(3),
                    now()->subDays(1),
                );
        $status = $this->statuses->where('category', $statusCategory)->random();

        return [
            'type' => $type,
            'subject' => $type === 'ticket' ? $this->subjects->random() : null,
            'status_id' => $status['id'],
            'status_category' => $status['category'],
            'created_at' => $date,
            'updated_at' => $date,
            'user_id' =>
                $type === 'ticket'
                    ? $this->customers->whereNotNull('email')->random()->id
                    : $this->customers->random()->id,
            'assignee_id' => $config['assignee_id'] ?? null,
            'assigned_at' => $config['assignee_id'] ? $date : null,
            'closed_by' =>
                $statusCategory === Conversation::STATUS_CLOSED
                    ? $config['assignee_id'] ?? null
                    : null,
            'closed_at' =>
                $statusCategory === Conversation::STATUS_CLOSED
                    ? ($type === 'ticket'
                        ? Carbon::parse($date)->addHours(mt_rand(1, 24))
                        : Carbon::parse($date)->addMinutes(mt_rand(5, 60)))
                    : null,
            'group_id' =>
                $config['group_id'] ??
                $this->groups
                    ->filter(
                        fn($group) => !isset($config['assignee_id']) ||
                            $group->users->contains($config['assignee_id']),
                    )
                    ->random()->id,
            'channel' =>
                $type === 'chat'
                    ? 'widget'
                    : (rand(0, 1)
                        ? 'email'
                        : 'website'),
        ];
    }

    protected function attachCategoryToConversations()
    {
        $conversationIds = Conversation::pluck('id')->toArray();
        $categoryAttribute = CustomAttribute::where('key', 'category')->first();
        $possibleValues = Arr::pluck(
            $categoryAttribute->config['options'],
            'value',
        );

        $data = [];

        foreach ($conversationIds as $conversationId) {
            $data[] = [
                'attributable_id' => $conversationId,
                'attributable_type' => Conversation::MODEL_TYPE,
                'attribute_id' => $categoryAttribute->id,
                'value' => Arr::random($possibleValues),
            ];
        }

        DB::table('attributables')->insert($data);
    }
}
