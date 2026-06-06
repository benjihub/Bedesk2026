<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 191);
            $table->string('color', 50)->nullable();
            $table->boolean('default')->nullable();
            $table->string('assignment_mode', 20)->nullable();
            $table->timestamps();
        });
    }
};
