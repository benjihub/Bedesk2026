<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'image')) {
            Schema::table('users', function (Blueprint $table) {
                $table->renameColumn('avatar', 'image');
            });
        }

        if (!Schema::hasColumn('workspace_invites', 'image')) {
            Schema::table('workspace_invites', function (Blueprint $table) {
                $table->renameColumn('avatar', 'image');
            });
        }
    }
};
