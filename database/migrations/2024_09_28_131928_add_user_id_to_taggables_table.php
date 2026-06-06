<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('taggables', 'user_id')) {
            return;
        }

        Schema::table('taggables', function (Blueprint $table) {
            $table->integer('user_id')->unsigned()->index()->nullable();
        });
    }

    public function down(): void
    {
        //
    }
};
