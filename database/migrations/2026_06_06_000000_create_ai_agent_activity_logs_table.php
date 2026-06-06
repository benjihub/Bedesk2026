<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('ai_agent_activity_logs')) {
            Schema::create('ai_agent_activity_logs', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('group_id')->nullable()->index();
                $table->unsignedBigInteger('ai_agent_id')->nullable()->index();
                $table->unsignedInteger('conversation_id')->nullable()->index();
                $table->string('agent_name')->index();
                $table->string('status')->default('success');
                $table->unsignedInteger('response_time_ms')->nullable();
                $table->unsignedInteger('prompt_tokens')->nullable();
                $table->unsignedInteger('completion_tokens')->nullable();
                $table->unsignedInteger('total_tokens')->nullable();
                $table->text('error_message')->nullable();
                $table->timestamps();

                $table
                    ->foreign('group_id')
                    ->references('id')
                    ->on('groups')
                    ->nullOnDelete();

                $table
                    ->foreign('ai_agent_id')
                    ->references('id')
                    ->on('ai_agents')
                    ->nullOnDelete();

                $table
                    ->foreign('conversation_id')
                    ->references('id')
                    ->on('conversations')
                    ->nullOnDelete();
            });
            return;
        }

        Schema::table('ai_agent_activity_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('ai_agent_activity_logs', 'group_id')) {
                $table->unsignedBigInteger('group_id')->nullable()->index()->after('id');
                $table
                    ->foreign('group_id')
                    ->references('id')
                    ->on('groups')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('ai_agent_activity_logs', 'ai_agent_id')) {
                $table->unsignedBigInteger('ai_agent_id')->nullable()->index()->after('group_id');
                $table
                    ->foreign('ai_agent_id')
                    ->references('id')
                    ->on('ai_agents')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('ai_agent_activity_logs', 'conversation_id')) {
                $table->unsignedInteger('conversation_id')->nullable()->index()->after('ai_agent_id');
                $table
                    ->foreign('conversation_id')
                    ->references('id')
                    ->on('conversations')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_agent_activity_logs');
    }
};
