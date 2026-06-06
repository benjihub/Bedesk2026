<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // The first version of this migration used foreignId(), but this app's
        // legacy conversations/users tables use increments() unsigned INT ids.
        Schema::dropIfExists('ticket_event_logs');

        Schema::create('ticket_event_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('conversation_id');
            $table->string('event_type', 100);
            $table->string('actor_type', 50)->nullable();
            $table->unsignedInteger('actor_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();

            $table->index(['conversation_id', 'created_at']);
            $table->index(['actor_id', 'created_at']);
            $table->index(['event_type', 'created_at']);

            $table
                ->foreign('conversation_id')
                ->references('id')
                ->on('conversations')
                ->cascadeOnDelete();
            $table
                ->foreign('actor_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_event_logs');
    }
};
