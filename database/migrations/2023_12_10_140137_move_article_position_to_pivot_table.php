<?php

use App\HelpCenter\Models\HcArticle;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('articles', 'position')) {
            return;
        }

        HcArticle::lazy()->each(function (HcArticle $article) {
            \Illuminate\Support\Facades\DB::table('category_article')
                ->where('article_id', $article->id)
                ->update([
                    'position' => $article->position,
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
