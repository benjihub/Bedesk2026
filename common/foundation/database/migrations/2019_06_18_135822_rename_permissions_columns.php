<?php

use Common\Database\Traits\AddsIndexToExistingTable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RenamePermissionsColumns extends Migration
{
    use AddsIndexToExistingTable;

    public function up()
    {
        $tables = ['users', 'roles', 'billing_plans'];

        foreach ($tables as $tableName) {
            // rename permissions column
            if (Schema::hasColumn($tableName, 'permissions')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->renameColumn('permissions', 'legacy_permissions');
                });
            }

            // drop permissions index, if exists
            Schema::table($tableName, function (Blueprint $table) use (
                $tableName,
            ) {
                $this->removeIndex($table, 'legacy_permissions');
                $this->removeIndex($table, 'permissions');
            });
        }
    }

    public function down()
    {
        //
    }
}
