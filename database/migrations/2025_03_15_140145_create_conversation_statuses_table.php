<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('conversation_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('label', 100);
            $table->string('user_label', 100)->nullable();
            $table->tinyInteger('category')->default(5)->index();
            $table->boolean('active')->default(true)->index();
            $table->boolean('internal')->default(false)->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_statuses');
    }
};
