<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('group_user', function (Blueprint $table) {
            $table->id();
            $table->integer('group_id')->unsigned()->index();
            $table->integer('user_id')->unsigned()->index();
            $table
                ->string('conversation_priority', 40)
                ->index()
                ->default('backup')
                ->nullable();
            $table->timestamp('created_at')->nullable()->index();
        });
    }
};
