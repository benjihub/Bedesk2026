<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ai_agent_flows', function (Blueprint $table) {
            $table->unsignedBigInteger('group_id')->nullable()->index()->after('id');

            $table
                ->foreign('group_id')
                ->references('id')
                ->on('groups')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('ai_agent_flows', function (Blueprint $table) {
            $table->dropForeign(['group_id']);
            $table->dropColumn('group_id');
        });
    }
};
