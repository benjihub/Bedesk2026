<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up()
    {
        if (!Schema::hasTable('tickets')) {
            return;
        }

        $tags = DB::table('tags')
            ->where('type', 'status')
            ->get();

        foreach ($tags as $tag) {
            $ticketIds = DB::table('taggables')
                ->where('tag_id', $tag->id)
                ->where('taggable_type', 'ticket')
                ->pluck('taggable_id');
            DB::table('tickets')
                ->whereIn('id', $ticketIds)
                ->update([
                    'status' => $tag->name,
                ]);
        }
    }

    public function down()
    {
    }
};
