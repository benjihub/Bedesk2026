<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_conversation_memories', function (Blueprint $table) {
            $table->id();
            $table->string('username', 191);
            $table->unsignedBigInteger('group_id');
            $table->text('summary')->nullable();
            $table->string('last_sentiment', 50)->nullable();
            $table->string('last_issue_type', 100)->nullable();
            $table->json('notes')->nullable();
            $table->timestamp('last_interaction_at')->nullable();
            $table->timestamps();

            $table->unique(['username', 'group_id']);
            $table->foreign('group_id')
                ->references('id')
                ->on('groups')
                ->onDelete('cascade');
        });
    }
};
