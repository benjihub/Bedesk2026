<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('attributes')) {
            return;
        }

        Schema::create('attributes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60)->index();
            $table->string('key', 60)->index()->unique();
            $table->string('format', 20);
            $table->boolean('active')->default(true);
            $table->string('type', 20)->index()->default('conversation');
            $table->boolean('internal')->default(false);
            $table->boolean('hide_in_form')->default(false);
            $table->boolean('required')->default(false);
            $table->string('permission');
            $table->string('description')->nullable();
            $table->string('customer_name')->nullable();
            $table->string('customer_description')->nullable();
            $table->boolean('materialized')->default(false);
            $table->longText('config')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attributes');
    }
};
