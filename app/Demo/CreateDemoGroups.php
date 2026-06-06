<?php

namespace App\Demo;

use App\Team\Models\Group;
use Database\Seeders\DefaultGroupSeeder;
use Illuminate\Support\Carbon;

class CreateDemoGroups
{
    public function execute()
    {
        $groupNames = [
            'Onboarding Experts',
            'Client Relations',
            'Account Management',
            'Product Guidance Team',
            'Technical Support',
        ];

        $now = Carbon::now();
        $groupsToInsert = [];

        foreach ($groupNames as $name) {
            $groupsToInsert[] = [
                'name' => $name,
                'assignment_mode' => 'manual',
                'default' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        Group::insert($groupsToInsert);

        app(DefaultGroupSeeder::class)->run();
    }
}
