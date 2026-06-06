<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up()
    {
        Schema::create('canned_replies', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name')->index();
            $table->boolean('shared')->default(0);
            $table->integer('group_id')->nullable()->unsigned()->index();
            $table->integer('user_id');
            $table->text('body');
            $table->timestamps();

            $table->unique(['name', 'user_id']);

            $table->collation = config('database.connections.mysql.collation');
            $table->charset = config('database.connections.mysql.charset');
        });
    }

    public function down()
    {
        Schema::drop('canned_replies');
    }
};
