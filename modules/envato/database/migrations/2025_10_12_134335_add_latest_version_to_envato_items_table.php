<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('envato_items', 'latest_version')) {
            return;
        }

        Schema::table('envato_items', function (Blueprint $table) {
            $table->string('latest_version', 10)->nullable();
        });
    }
};
