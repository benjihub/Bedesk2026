<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('agent_settings', function (Blueprint $table) {
            $table->id();
            $table
                ->integer('user_id')
                ->unsigned()
                ->index();
            $table
                ->integer('assignment_limit')
                ->unsigned()
                ->default(6)
                ->index();
            $table
                ->string('accepts_conversations', 30)
                ->default('yes')
                ->index();
            $table->text('working_hours')->nullable();
        });
    }
};
