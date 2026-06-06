<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasColumn('canned_replies', 'shortcut')) {
            return;
        }

        Schema::table('canned_replies', function (Blueprint $table) {
            $table->string('shortcut', 20)->nullable()->unique()->after('name');
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('canned_replies', 'shortcut')) {
            return;
        }

        Schema::table('canned_replies', function (Blueprint $table) {
            $table->dropUnique(['shortcut']);
            $table->dropColumn('shortcut');
        });
    }
};
