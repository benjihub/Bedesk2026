<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        if (Schema::hasTable('whatsapp_contacts')) {
            return;
        }

        Schema::create('whatsapp_contacts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('account_id')->nullable();
            $table->string('wa_id')->index();
            $table->string('phone')->nullable();
            $table->string('name')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['account_id', 'wa_id']);
            $table
                ->foreign('account_id')
                ->references('id')
                ->on('whatsapp_accounts')
                ->nullOnDelete();
        });
    }

    public function down()
    {
        if (!Schema::hasTable('whatsapp_contacts')) {
            return;
        }

        Schema::drop('whatsapp_contacts');
    }
};
