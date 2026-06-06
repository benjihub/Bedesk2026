<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class MaterializeOwnerIdInFileEntriesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::table('file_entry_models')
            ->where('owner', true)
            ->where('model_type', 'user')
            ->lazyById(100)
            ->each(function ($row) {
                DB::table('file_entries')
                    ->where('id', $row->file_entry_id)
                    ->update(['owner_id' => $row->model_id]);
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
