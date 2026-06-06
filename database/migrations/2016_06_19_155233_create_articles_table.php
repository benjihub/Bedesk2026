<?php

namespace Helpdesk\Database\migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->increments('id');
            $table->string('title')->index();
            $table->mediumText('body');
            $table
                ->string('slug')
                ->index()
                ->nullable();
            $table
                ->boolean('draft')
                ->default(0)
                ->index();
            $table
                ->string('visibility')
                ->default('public')
                ->index();
            $table
                ->integer('views')
                ->default(0)
                ->unsigned()
                ->index();
            $table->text('description')->nullable();
            $table->timestamps();

            $table->collation = config('database.connections.mysql.collation');
            $table->charset = config('database.connections.mysql.charset');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('articles');
    }
};
