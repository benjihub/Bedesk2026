<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::table('agent_settings')
            ->where(function ($query) {
                $query
                    ->whereNull('assignment_limit')
                    ->orWhere('assignment_limit', 6);
            })
            ->update(['assignment_limit' => 5]);
    }

    public function down(): void
    {
        DB::table('agent_settings')
            ->where('assignment_limit', 5)
            ->update(['assignment_limit' => 6]);
    }
};
