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
        Schema::create('conversation_views', function (Blueprint $table) {
            $table->id();
            $table->string('key', 10)->unique()->nullable()->index();
            $table->string('name');
            $table->string('icon', 50)->nullable();
            $table->string('description')->nullable();
            $table->string('access', 50)->default('anyone')->index();
            $table->boolean('pinned')->default(false);
            $table->boolean('active')->default(true);
            $table->boolean('internal')->default(false)->index();
            $table->integer('order')->unsigned()->default(0)->index();
            $table->integer('owner_id')->unsigned()->nullable()->index();
            $table->integer('group_id')->unsigned()->nullable()->index();
            $table->string('order_by', 50)->default('status_category');
            $table->string('order_dir', 5)->default('desc');
            $table->text('conditions')->nullable();
            $table->text('columns')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_views');
    }
};
