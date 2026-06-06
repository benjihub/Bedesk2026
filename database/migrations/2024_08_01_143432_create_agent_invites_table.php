<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('agent_invites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table
                ->integer('group_id')
                ->unsigned()
                ->index();
            $table
                ->integer('role_id')
                ->unsigned()
                ->index();
            $table->string('email')->index();
            $table->timestamps();
        });
    }
};
