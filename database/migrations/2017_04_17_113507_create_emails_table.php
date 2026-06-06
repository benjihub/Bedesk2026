<?php

namespace modules\helpdesk\database\migrations;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Schema;

return new class extends Migration {
    public function up()
    {
        if (Schema::hasTable('emails')) {
            return;
        }

        Schema::create('emails', function (Blueprint $table) {
            $table->increments('id');
            $table->string('address')->index();
            $table->integer('user_id')->index();
        });
    }

    public function down()
    {
        Schema::drop('emails');
    }
};
