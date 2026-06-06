<?php

use Illuminate\Database\Migrations\Migration;

class DeleteDeprecatedReplyPermissions extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $ids = DB::table('permissions')
            ->where('name', 'like', 'replies.%')
            ->orWhere('name', 'like', 'conditions.%')
            ->orWhere('name', 'like', 'actions.%')
            ->orWhere('name', 'like', 'categories.%')
            ->pluck('id');
        DB::table('permissionables')
            ->whereIn('permission_id', $ids)
            ->delete();
        DB::table('permissions')
            ->whereIn('id', $ids)
            ->delete();
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
