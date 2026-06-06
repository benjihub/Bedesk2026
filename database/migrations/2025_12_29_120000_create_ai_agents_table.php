<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ai_agents', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('image')->nullable();
            $table->boolean('enabled')->default(true);
            $table->string('personality')->default('friendly');
            $table->string('greeting_type')->default('basicGreeting');
            $table->unsignedBigInteger('initial_flow_id')->nullable();
            $table->text('basic_greeting_message')->nullable();
            $table->json('basic_greeting_flow_ids')->nullable();
            $table->text('transfer_instruction')->nullable();
            $table->text('cant_assist_instruction')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_agents');
    }
};