<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            if (!Schema::hasColumn('conversations', 'channel')) {
                $table
                    ->string('channel', 10)
                    ->nullable()
                    ->index()
                    ->after('type');
            }
        });
    }
};
