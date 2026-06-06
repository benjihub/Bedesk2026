<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('ai_agent_tools')) {
            Schema::create('ai_agent_tools', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('group_id')->nullable()->index();
                $table->string('name');
                $table->text('description')->nullable();
                $table->boolean('active')->default(false);
                $table->string('type')->nullable();
                $table->unsignedInteger('activation_count')->default(0);
                $table->boolean('allow_direct_use')->default(false);
                $table->json('config')->nullable();
                $table->json('response_schema')->nullable();
                $table->longText('live_response')->nullable();
                $table->longText('example_response')->nullable();
                $table->timestamps();

                $table
                    ->foreign('group_id')
                    ->references('id')
                    ->on('groups')
                    ->nullOnDelete();
            });

            return;
        }

        Schema::table('ai_agent_tools', function (Blueprint $table) {
            if (!Schema::hasColumn('ai_agent_tools', 'group_id')) {
                $table->unsignedBigInteger('group_id')->nullable()->index()->after('id');

                $table
                    ->foreign('group_id')
                    ->references('id')
                    ->on('groups')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('ai_agent_tools')) {
            return;
        }

        $hasGroupId = Schema::hasColumn('ai_agent_tools', 'group_id');

        if ($hasGroupId) {
            Schema::table('ai_agent_tools', function (Blueprint $table) {
                $table->dropForeign(['group_id']);
                $table->dropColumn('group_id');
            });
        }
    }
};
