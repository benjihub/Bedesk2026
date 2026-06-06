<?php

namespace App\Demo;

use App\CannedReplies\Models\CannedReply;
use App\Models\User;
use App\Team\Models\Group;
use Faker\Generator;

class CreateDemoCannedReplies
{
    protected Generator $faker;

    public function __construct()
    {
        $this->faker = app(Generator::class);
    }

    public function execute(): void
    {
        $agents = User::where('type', 'agent')->get();
        $defaultGroup = Group::where('default', true)->first();

        $data = json_decode(
            file_get_contents(base_path('resources/demo/canned-replies.json')),
            true,
        );

        foreach ($data as $key => $replyData) {
            $date = $this->faker->dateTimeBetween(
                now()->subDays(14),
                now()->subDays(1),
            );
            $data[$key] = array_merge($replyData, [
                'group_id' => $defaultGroup->id,
                'shared' => true,
                'user_id' => $agents->random()->id,
                'created_at' => $date,
                'updated_at' => $date,
            ]);
        }

        CannedReply::insert($data);
    }
}
