<?php

use Common\Database\Traits\AddsIndexToExistingTable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    use AddsIndexToExistingTable;

    public function up(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $this->removeUniqueIndex($table, 'permissions_name_unique');
            $this->addIndexIfDoesNotExist($table, ['name', 'type'], 'unique');
        });
    }
};
