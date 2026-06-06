<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('widget_sessions')) {
            return;
        }

        Schema::create('widget_sessions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('visitor_id')->unique();
            $table->unsignedBigInteger('last_conversation_id')->nullable();
            $table->timestamps();

            // Use same type as conversations.id but avoid FK constraint
            // mismatches across installations; keep this as a soft link.
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('widget_sessions');
    }
};
