<?php

use Common\Database\Traits\AddsIndexToExistingTable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ChangeUniqueIndexOnTagsTable extends Migration
{
    use AddsIndexToExistingTable;

    public function up()
    {
        Schema::table('tags', function (Blueprint $table) {
            $table->string('type', 30)->default('custom')->change();

            $this->removeUniqueIndex($table, 'tags_name_unique');
            $this->removeUniqueIndex($table, 'tags_name_type_unique');

            $table->unique(['name', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
}
