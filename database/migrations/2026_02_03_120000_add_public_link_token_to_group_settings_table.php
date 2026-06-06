<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('group_settings', function (Blueprint $table) {
            $table->string('public_link_token', 64)->nullable()->unique()->after('group_id');
        });
    }

    public function down(): void
    {
        Schema::table('group_settings', function (Blueprint $table) {
            $table->dropUnique(['public_link_token']);
            $table->dropColumn('public_link_token');
        });
    }
};
