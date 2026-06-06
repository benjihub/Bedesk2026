<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up()
    {
        if (Schema::hasColumn('canned_replies', 'shared')) {
            return;
        }

        Schema::table('canned_replies', function (Blueprint $table) {
            $table->boolean('shared')->default(0);
        });
    }
};
