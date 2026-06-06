<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasColumn('canned_replies', 'group_id')) {
            return;
        }

        Schema::table('canned_replies', function (Blueprint $table) {
            $table
                ->integer('group_id')
                ->nullable()
                ->unsigned()
                ->index();
        });

        $defaultGroup = DB::table('groups')
            ->where('default', true)
            ->first();
        if ($defaultGroup) {
            DB::table('canned_replies')
                ->where('group_id', null)
                ->update(['group_id' => $defaultGroup->id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
