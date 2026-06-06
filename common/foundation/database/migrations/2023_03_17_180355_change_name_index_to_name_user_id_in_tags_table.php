<?php

use Common\Database\Traits\AddsIndexToExistingTable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    use AddsIndexToExistingTable;

    public function up()
    {
        Schema::table('tags', function (Blueprint $table) {
            $this->removeUniqueIndex($table, 'tags_name_type_unique');
            $this->removeUniqueIndex($table, 'tags_name_user_id_type_unique');

            $table->unique(['name', 'user_id', 'type']);
        });
    }

    public function down()
    {
        Schema::table('tags', function (Blueprint $table) {
            //
        });
    }
};
