<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ai_billing_notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('billing_account_id')->index();
            $table->string('event')->index();
            $table->string('tone')->default('info')->index();
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable();
            $table->string('dedupe_key')->nullable()->unique();
            $table->timestamp('notified_at')->nullable()->index();
            $table->timestamps();

            $table
                ->foreign('billing_account_id')
                ->references('id')
                ->on('ai_billing_accounts')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_billing_notifications');
    }
};
