<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            if (!Schema::hasColumn('conversations', 'assignee_id')) {
                $table->renameColumn('assigned_to', 'assignee_id');

                if (
                    Schema::hasIndex(
                        'conversations',
                        'tickets_assigned_to_index',
                    )
                ) {
                    $table->renameIndex(
                        'tickets_assigned_to_index',
                        'tickets_assignee_id_index',
                    );
                } else {
                    $table->renameIndex(
                        'conversations_assigned_to_index',
                        'conversations_assignee_id_index',
                    );
                }
            }
            $table
                ->string('assigned_to', 10)
                ->default('agent')
                ->index()
                ->after('assignee_id');
            $table
                ->boolean('ai_agent_involved')
                ->default(false)
                ->index()
                ->before('group_id');
        });
    }
};
