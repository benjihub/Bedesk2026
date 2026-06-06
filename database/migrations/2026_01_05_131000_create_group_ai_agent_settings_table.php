<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('group_ai_agent_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('group_id')->unique();
            // Stores per-group overrides for `settings('aiAgent')` (ex: personality, initialFlowId, etc.)
            $table->json('overrides')->nullable();
            $table->timestamps();

            $table
                ->foreign('group_id')
                ->references('id')
                ->on('groups')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_ai_agent_settings');
    }
};
