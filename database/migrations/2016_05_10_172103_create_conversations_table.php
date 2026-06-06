<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        if (Schema::hasTable('conversations') || Schema::hasTable('tickets')) {
            return;
        }

        Schema::create('conversations', function (Blueprint $table) {
            $table->increments('id');
            $table
                ->string('subject', 191)
                ->nullable()
                ->index();
            $table
                ->integer('user_id')
                ->nullable()
                ->index();
            $table
                ->string('type', 60)
                ->index()
                ->nullable();
            $table
                ->integer('closed_by')
                ->nullable()
                ->index();
            $table
                ->integer('assigned_to')
                ->nullable()
                ->index();
            $table
                ->integer('group_id')
                ->nullable()
                ->index();
            $table
                ->timestamp('created_at')
                ->nullable()
                ->index();
            $table
                ->timestamp('updated_at')
                ->nullable()
                ->index();
            $table
                ->timestamp('closed_at')
                ->nullable()
                ->index();
            $table
                ->string('received_at_email', 100)
                ->nullable()
                ->index();

            $table->collation = config('database.connections.mysql.collation');
            $table->charset = config('database.connections.mysql.charset');
        });
    }

    public function down()
    {
        Schema::drop('conversations');
    }
};
