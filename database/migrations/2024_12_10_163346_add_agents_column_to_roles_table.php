<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('roles', 'agents')) {
            Schema::table('roles', function (Blueprint $table) {
                $table
                    ->boolean('agents')
                    ->default(false)
                    ->after('guests')
                    ->index();
            });
        }

        $agentsRole = DB::table('roles')
            ->where('name', 'agents')
            ->first();

        if (!$agentsRole) {
            return;
        }

        DB::table('roles')
            ->where('name', 'agents')
            ->update(['agents' => true]);

        $existingUserIds = DB::table('user_role')
            ->where('role_id', $agentsRole->id)
            ->pluck('user_id');

        $agentIds = User::where(function ($builder) {
            $builder
                ->whereHas('permissions', function ($query) {
                    $query->whereIn('name', [
                        'conversations.update',
                        'chats.update',
                        'admin',
                    ]);
                })
                ->orWhereHas('roles', function ($query) {
                    $query->whereHas('permissions', function ($query) {
                        $query->whereIn('name', [
                            'conversations.update',
                            'chats.update',
                            'admin',
                        ]);
                    });
                });
        })
            ->pluck('id')
            ->diff($existingUserIds);

        DB::table('user_role')->insert(
            $agentIds
                ->map(
                    fn($id) => [
                        'user_id' => $id,
                        'role_id' => $agentsRole->id,
                        'created_at' => now(),
                    ],
                )
                ->toArray(),
        );
    }
};
