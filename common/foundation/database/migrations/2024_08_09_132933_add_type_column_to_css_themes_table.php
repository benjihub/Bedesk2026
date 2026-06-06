<?php

use Illuminate\Database\Migrations\Migration;
use Common\Database\Traits\AddsIndexToExistingTable;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    use AddsIndexToExistingTable;

    public function up(): void
    {
        Schema::table('css_themes', function (Blueprint $table) {
            $table
                ->string('type', 40)
                ->index()
                ->default('site')
                ->after('user_id');
            $table->integer('user_id')->nullable()->change();

            $this->removeIndex($table, 'css_themes_name_unique');
        });
    }
};
