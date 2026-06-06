<?php

use Database\Seeders\DefaultGroupSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $group = DB::table('groups')->where('default', true)->first();
        if (!$group) {
            (new DefaultGroupSeeder())->run();
            $group = DB::table('groups')->where('default', true)->first();
        }

        // agents

        $records = DB::table('users')->where('type', 'agent')->pluck('id')->map(
            fn($agentId) => [
                'user_id' => $agentId,
                'group_id' => $group->id,
                'created_at' => now(),
            ],
        );

        $existing = DB::table('group_user')
            ->whereIn('user_id', $records->pluck('user_id'))
            ->whereIn('group_id', $records->pluck('group_id'))
            ->pluck('user_id');

        DB::table('group_user')->insert(
            $records
                ->filter(
                    fn($record) => !$existing->contains($record['user_id']),
                )
                ->toArray(),
        );

        // conversations

        DB::table('conversations')
            ->whereNull('group_id')
            ->update(['group_id' => $group->id]);
    }
};
