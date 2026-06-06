<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('articles', function (Blueprint $table) {
            if (!Schema::hasColumn('articles', 'managed_by_role')) {
                $table
                    ->integer('managed_by_role')
                    ->unsigned()
                    ->nullable()
                    ->index()
                    ->after('description');
            }
            if (!Schema::hasColumn('articles', 'visible_to_role')) {
                $table
                    ->integer('visible_to_role')
                    ->unsigned()
                    ->nullable()
                    ->index()
                    ->after('managed_by_role');
            }
            if (!Schema::hasColumn('articles', 'author_id')) {
                $table
                    ->integer('author_id')
                    ->unsigned()
                    ->index()
                    ->after('visible_to_role');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
};
