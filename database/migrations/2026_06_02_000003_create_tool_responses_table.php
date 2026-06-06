<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('tool_responses')) {
            return;
        }

        Schema::create('tool_responses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tool_id')->index();
            $table->string('type');
            $table->string('request_key')->index();
            $table->longText('response')->nullable();
            $table->timestamps();

            $table
                ->foreign('tool_id')
                ->references('id')
                ->on('ai_agent_tools')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tool_responses');
    }
};
