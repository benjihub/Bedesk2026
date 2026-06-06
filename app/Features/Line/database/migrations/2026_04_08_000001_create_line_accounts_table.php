<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        if (Schema::hasTable('line_accounts')) {
            return;
        }

        Schema::create('line_accounts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->nullable();
            $table->string('channel_id')->unique();
            $table->string('channel_secret')->nullable();
            $table->text('channel_token')->nullable();
            $table->boolean('is_default')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        if (!Schema::hasTable('line_accounts')) {
            return;
        }

        Schema::drop('line_accounts');
    }
};
