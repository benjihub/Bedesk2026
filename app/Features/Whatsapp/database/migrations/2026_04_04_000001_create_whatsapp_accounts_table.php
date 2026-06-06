<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        if (Schema::hasTable('whatsapp_accounts')) {
            return;
        }

        Schema::create('whatsapp_accounts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->nullable();
            $table->string('phone_number_id')->unique();
            $table->string('business_account_id')->nullable();
            $table->text('access_token')->nullable();
            $table->boolean('is_default')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        if (!Schema::hasTable('whatsapp_accounts')) {
            return;
        }

        Schema::drop('whatsapp_accounts');
    }
};
