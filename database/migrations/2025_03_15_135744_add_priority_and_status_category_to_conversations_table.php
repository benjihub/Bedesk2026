<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table
                ->tinyInteger('status_category')
                ->unsigned()
                ->default(5)
                ->index()
                ->after('subject');
            $table
                ->integer('status_id')
                ->unsigned()
                ->index()
                ->after('status_category');
            $table
                ->tinyInteger('priority')
                ->unsigned()
                ->default(2)
                ->index()
                ->after('status_id');

            $table->index(['status_category', 'updated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn('status_category');
            $table->dropColumn('status_id');
            $table->dropColumn('priority');
        });
    }
};
