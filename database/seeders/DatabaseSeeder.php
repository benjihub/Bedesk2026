<?php

namespace Database\Seeders;

use App\Models\User;
use Common\Auth\Roles\Role;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(DefaultGroupSeeder::class);
        $this->call(InternalAttributesSeeder::class);
        $this->call(ConversationStatusesSeeder::class);
        $this->call(DefaultViewsSeeder::class);

        $adminUser = app(User::class)->findAdmin();
        $agentRole = Role::where('name', 'agents')->first();
        if ($adminUser && $agentRole) {
            $adminUser->roles()->sync([$agentRole->id], false);
        }
    }
}
