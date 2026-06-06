<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if ( ! Schema::hasColumn('triggers', 'config')) {
            Schema::table('triggers', function (Blueprint $table) {
                $table->text('config')->after('description');
            });
        }
    }
};
