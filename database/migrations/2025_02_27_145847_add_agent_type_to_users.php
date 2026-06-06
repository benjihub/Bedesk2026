<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        User::where('type', 'user')
            ->with('permissions', 'roles')
            ->chunk(100, function ($users) {
                foreach ($users as $user) {
                    if (
                        $user->hasPermission($user, 'conversations.update') ||
                        $user->hasPermission($user, 'chats.update') ||
                        $user->roles->contains('agents', true)
                    ) {
                        $user->type = 'agent';
                        $user->save();
                    }
                }
            });
    }
};
