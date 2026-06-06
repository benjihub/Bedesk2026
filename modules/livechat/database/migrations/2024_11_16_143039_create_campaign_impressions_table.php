<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('campaign_impressions', function (Blueprint $table) {
            $table->id();

            $table
                ->bigInteger('campaign_id')
                ->unsigned()
                ->index();
            $table
                ->bigInteger('user_id')
                ->unsigned()
                ->index();
            $table->uuid('session_id')->index();
            $table
                ->boolean('interacted')
                ->default(false)
                ->index();

            $table->timestamp('created_at')->nullable();
        });
    }
};
