<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('conversation_items', function (Blueprint $table) {
            $table->integer('vector_id')->nullable()->index();
            $table->text('data')->nullable();
        });
    }
};
