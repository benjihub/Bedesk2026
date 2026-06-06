<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('file_entry_models', function (Blueprint $table) {
            if (!Schema::hasColumn('file_entry_models', 'relation_type')) {
                $table
                    ->string('relation_type', 30)
                    ->after('model_type')
                    ->default('access')
                    ->index();
            }

            if (!Schema::hasColumn('file_entry_models', 'origin')) {
                $table->string('origin', 50)->default('local')->index();
            }

            $table->index(['model_type', 'model_id', 'relation_type']);

            if (
                Schema::hasIndex(
                    'file_entry_models',
                    'uploadables_upload_id_uploadable_id_uploadable_type_unique',
                )
            ) {
                $table->dropIndex(
                    'uploadables_upload_id_uploadable_id_uploadable_type_unique',
                );
            }

            if (Schema::hasIndex('file_entry_models', 'uploadable_unique')) {
                $table->dropIndex('uploadable_unique');
            }
        });
    }
};
