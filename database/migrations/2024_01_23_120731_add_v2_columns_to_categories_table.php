<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'managed_by_role')) {
                $table
                    ->integer('managed_by_role')
                    ->unsigned()
                    ->nullable()
                    ->index()
                    ->after('parent_id');
            }
            if (!Schema::hasColumn('categories', 'visible_to_role')) {
                $table
                    ->integer('visible_to_role')
                    ->unsigned()
                    ->nullable()
                    ->index()
                    ->after('managed_by_role');
            }
        });

        if (Schema::hasColumn('categories', 'hidden')) {
            Schema::dropColumns('categories', 'hidden');
        }
    }

    public function down()
    {
        //
    }
};
