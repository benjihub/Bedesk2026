<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        if (Schema::hasTable('line_messages')) {
            return;
        }

        Schema::create('line_messages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('account_id')->nullable();
            $table->unsignedBigInteger('contact_id')->nullable();
            $table->string('direction', 20);
            $table->string('provider_message_id')->nullable()->index();
            $table->string('from', 40)->nullable();
            $table->string('to', 40)->nullable();
            $table->string('type', 40)->nullable();
            $table->text('body')->nullable();
            $table->string('status', 40)->nullable();
            $table->integer('provider_timestamp')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();

            $table
                ->foreign('account_id')
                ->references('id')
                ->on('line_accounts')
                ->nullOnDelete();
            $table
                ->foreign('contact_id')
                ->references('id')
                ->on('line_contacts')
                ->nullOnDelete();
        });
    }

    public function down()
    {
        if (!Schema::hasTable('line_messages')) {
            return;
        }

        Schema::drop('line_messages');
    }
};
