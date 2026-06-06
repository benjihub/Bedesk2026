<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        if (Schema::hasTable('line_contacts')) {
            return;
        }

        Schema::create('line_contacts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('account_id')->nullable();
            $table->string('external_id')->index();
            $table->string('display_name')->nullable();
            $table->json('profile')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['account_id', 'external_id']);
            $table
                ->foreign('account_id')
                ->references('id')
                ->on('line_accounts')
                ->nullOnDelete();
        });
    }

    public function down()
    {
        if (!Schema::hasTable('line_contacts')) {
            return;
        }

        Schema::drop('line_contacts');
    }
};
