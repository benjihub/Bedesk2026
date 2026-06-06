<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddEmailIdColToRepliesTable extends Migration
{
    public function up()
    {

        if (Schema::hasTable('replies')) {
            $tableName = 'replies';
        }  else {
            $tableName = 'conversation_items';
        }

        Schema::table($tableName, function (Blueprint $table) {
            $table
                ->string('email_id')
                ->nullable()
                ->index();
        });
    }
}
