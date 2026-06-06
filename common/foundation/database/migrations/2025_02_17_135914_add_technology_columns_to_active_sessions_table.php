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
        Schema::table('active_sessions', function (Blueprint $table) {
            $table
                ->string('browser', 30)
                ->after('ip_address')
                ->default('unknown')
                ->index();
            $table
                ->string('platform', 20)
                ->after('browser')
                ->default('unknown')
                ->index();
            $table
                ->string('device', 20)
                ->after('platform')
                ->default('unknown')
                ->index();
            $table
                ->string('country', 2)
                ->after('device')
                ->default('us')
                ->index();
            $table
                ->string('city', 100)
                ->after('country')
                ->nullable()
                ->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
