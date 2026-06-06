<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('file_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('file_entries', 'backend_id')) {
                $table
                    ->string('backend_id', 10)
                    ->nullable()
                    ->after('parent_id')
                    ->index();
            }

            if (!Schema::hasColumn('file_entries', 'upload_type')) {
                $table
                    ->string('upload_type', 30)
                    ->nullable()
                    ->after('backend_id')
                    ->index();
            }
        });
    }
};
