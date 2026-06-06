<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();

            $table->string('name')->unique();
            $table->boolean('enabled')->default(true);
            $table
                ->integer('impression_count')
                ->unsigned()
                ->index()
                ->default(0);
            $table
                ->integer('interaction_count')
                ->unsigned()
                ->index()
                ->default(0);
            $table->longText('content');
            $table->longText('conditions');
            $table->longText('appearance')->nullable();
            $table->float('width');
            $table->float('height');

            $table->timestamps();
        });
    }
};
