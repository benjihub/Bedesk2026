<?php

namespace Livechat\Commands;

use App\Models\User;
use Common\Auth\Actions\DeleteUsers;
use Illuminate\Console\Command;

class DeleteNeverActiveVisitors extends Command
{
    protected $signature = 'visitors:delete-never-active';

    public function handle()
    {
        User::whereNull('email')
            ->where('type', 'user')
            ->whereDoesntHave(
                'userSessions',
                fn($q) => $q->where('updated_at', '>', now()->subMonth()),
            )
            ->chunkById(100, function ($users) {
                (new DeleteUsers())->execute($users->pluck('id')->toArray());
            });
    }
}
