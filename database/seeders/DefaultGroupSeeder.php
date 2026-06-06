<?php

namespace Database\Seeders;

use App\Models\User;
use App\Team\Models\Group;
use Illuminate\Database\Seeder;

class DefaultGroupSeeder extends Seeder
{
    public function run(): void
    {
        if (!Group::count()) {
            $group = Group::create([
                'name' => 'General',
                'default' => true,
                'assignment_mode' => 'auto',
            ]);

            $admin = User::findAdmin();
            if ($admin) {
                $group->users()->attach($admin, [
                    'created_at' => now(),
                ]);
            }
        }
    }
}
