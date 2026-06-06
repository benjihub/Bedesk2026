<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->string('type', 20)->default('users')->change();
            if (!Schema::hasColumn('roles', 'permission_type')) {
                $table
                    ->string('permission_type', 20)
                    ->default('users')
                    ->index();
            }
        });

        Schema::table('permissions', function (Blueprint $table) {
            $table->string('type', 20)->default('users')->change();
        });

        DB::table('roles')
            ->where('type', 'sitewide')
            ->update(['type' => 'users']);

        DB::table('permissions')
            ->where('type', 'sitewide')
            ->update(['type' => 'users']);
    }
};
