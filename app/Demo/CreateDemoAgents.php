<?php

namespace App\Demo;

use App\Models\User;
use App\Team\Models\Group;
use Common\Auth\Permissions\Permission;
use Common\Auth\Roles\Role;
use Common\Auth\UserSession;
use Faker\Generator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class CreateDemoAgents
{
    protected Generator $faker;

    public function __construct()
    {
        $this->faker = app(Generator::class);
    }

    public function execute()
    {
        $groups = Group::all();
        $defaultGroup = $groups->firstWhere('default');

        $this->createMainAdmin();
        $this->createMainAgent();
        $this->createSecondaryAgents();

        $allAgents = User::where('type', 'agent')
            ->orWhere('email', 'admin@admin.com')
            ->orderBy('created_at', 'desc')
            ->get();

        $defaultGroup->users()->sync($allAgents->pluck('id'));

        foreach ($groups as $group) {
            foreach ($allAgents->random(rand(2, 3)) as $key => $agent) {
                $agent->groups()->syncWithPivotValues(
                    [$group->id, $defaultGroup->id],
                    [
                        'conversation_priority' => rand(0, 1)
                            ? 'backup'
                            : 'primary',
                        'created_at' => now()->subSeconds($key),
                    ],
                    detaching: false,
                );
            }
        }

        $allAgents->each(function (User $agent) {
            $agent->agentSettings()->create([
                'accepts_conversations' => 'yes',
                'assignment_limit' => 5,
                'working_hours' => null,
            ]);
        });

        $this->createUserSessions($allAgents);

        return $allAgents;
    }

    protected function createMainAdmin()
    {
        $adminsRole = Role::where('name', 'Admins')->first();

        $demoAdmin = User::create([
            'type' => 'agent',
            'name' => 'Demo Admin',
            'email' => 'admin@admin.com',
            'image' => url('images/avatars/male-1.jpg'),
            'password' => bcrypt('admin'),
            'email_verified_at' => now(),
        ]);

        $superAdminPermission = Permission::where('name', 'admin')->first();
        $demoAdmin->permissions()->attach($superAdminPermission);

        $demoAdmin->roles()->sync([$adminsRole->id]);

        // demo super admin
        $superAdmin = User::create([
            'email' => config('app.demo_email'),
            'type' => 'admin',
            'password' => config('app.demo_password'),
        ]);
        $superAdmin->permissions()->attach($superAdminPermission->id);
        $superAdmin->roles()->attach($adminsRole->id);
    }

    protected function createMainAgent()
    {
        $agentsRole = Role::where('name', 'Agents')->first();

        // create main demo agent and admin
        $demoAgent = User::create([
            'type' => 'agent',
            'name' => 'Demo Agent',
            'email' => 'agent@demo.com',
            'image' => url('images/avatars/male-2.jpg'),
            'password' => bcrypt('agent'),
            'email_verified_at' => now(),
        ]);
        $demoAgent
            ->roles()
            ->syncWithPivotValues([$agentsRole->id], ['created_at' => now()]);
    }

    /**
     * Creates secondary demo agents that can't be used to log in with.
     */
    protected function createSecondaryAgents()
    {
        $permission = Permission::where(
            'name',
            'conversations.update',
        )->first();
        $agentsRole = Role::where('name', 'Agents')->first();

        for ($i = 0; $i < 4; $i++) {
            $gender = $this->faker->boolean() ? 'male' : 'female';
            $agent = User::create([
                'type' => 'agent',
                'language' => 'en',
                'country' => 'us',
                'timezone' => 'America/New_York',
                'email_verified_at' => now(),
                'email' => $this->faker->unique()->safeEmail,
                'name' => $this->faker->name($gender),
                'gender' => $gender,
                'image' => $this->getAvatar($gender),
                'created_at' => now()->subMinute(),
                'updated_at' => now()->subMinute(),
            ]);

            $agent
                ->roles()
                ->syncWithPivotValues(
                    [$agentsRole->id],
                    ['created_at' => now()],
                );

            $agent->permissions()->attach($permission->id);
        }
    }

    protected function getAvatar(string $gender)
    {
        $avatarFileName =
            $gender . '-' . $this->faker->numberBetween(2, 4) . '.jpg';
        return url("images/avatars/$avatarFileName");
    }

    protected function createUserSessions(Collection $agents)
    {
        $cities = [
            'New York',
            'Los Angeles',
            'Chicago',
            'Houston',
            'Phoenix',
            'Philadelphia',
            'San Antonio',
            'San Diego',
            'Dallas',
            'San Jose',
        ];
        $sessions = $agents->map(
            fn(User $agent) => [
                'user_id' => $agent->id,
                'ip_address' => $this->faker->ipv4,
                'country' => 'us',
                'city' => Arr::random($cities),
                'platform' => Arr::random([
                    'windows',
                    'linux',
                    'ios',
                    'androidos',
                ]),
                'device' => Arr::random(['mobile', 'tablet', 'desktop']),
                'browser' => Arr::random([
                    'chrome',
                    'firefox',
                    'edge',
                    'internet explorer',
                    'safari',
                ]),
                'user_agent' => $this->faker->userAgent,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
        UserSession::insert($sessions->toArray());
    }
}
