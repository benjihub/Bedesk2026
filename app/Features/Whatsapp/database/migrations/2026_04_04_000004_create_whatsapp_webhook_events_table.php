<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        if (Schema::hasTable('whatsapp_webhook_events')) {
            return;
        }

        Schema::create('whatsapp_webhook_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('account_id')->nullable();
            $table->string('event_type', 60)->nullable();
            $table->boolean('signature_valid')->default(true);
            $table->json('headers')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamps();

            $table
                ->foreign('account_id')
                ->references('id')
                ->on('whatsapp_accounts')
                ->nullOnDelete();
        });
    }

    public function down()
    {
        if (!Schema::hasTable('whatsapp_webhook_events')) {
            return;
        }

        Schema::drop('whatsapp_webhook_events');
    }
};
