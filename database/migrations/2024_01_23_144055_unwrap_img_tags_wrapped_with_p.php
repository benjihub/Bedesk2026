<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('articles')
            ->lazyById(100)
            ->each(function ($article) {
                $pattern = '/<p>(<img[^>]*>)<\/p>/i';

                DB::table('articles')
                    ->where('id', $article->id)
                    ->update([
                        'body' => preg_replace($pattern, '$1', $article->body),
                    ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
