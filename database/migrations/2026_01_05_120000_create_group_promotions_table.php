<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('group_promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->string('title', 191);
            $table->text('description')->nullable();
            $table->unsignedInteger('discount')->nullable();
            $table->string('code', 191)->nullable();
            $table->text('terms')->nullable();
            $table->text('how_to_claim')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['group_id', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_promotions');
    }
};
