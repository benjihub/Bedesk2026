<?php

namespace App\HelpCenter\Actions;

use App\HelpCenter\Models\HcArticle;
use Illuminate\Support\Facades\DB;

class DeleteMultipleArticles
{
    public function execute(array $articleIds): void
    {
        // detach categories
        DB::table('category_article')
            ->whereIn('article_id', $articleIds)
            ->delete();

        // detach tags
        DB::table('taggables')
            ->whereIn('taggable_id', $articleIds)
            ->where('taggable_type', HcArticle::MODEL_TYPE)
            ->delete();

        // delete feedback
        DB::table('article_feedback')
            ->whereIn('article_id', $articleIds)
            ->delete();

        // delete chunks
        DB::table('ai_agent_chunks')
            ->where('chunkable_type', HcArticle::MODEL_TYPE)
            ->whereIn('chunkable_id', $articleIds)
            ->delete();

        // detach file entries
        DB::table('file_entry_models')
            ->where('model_type', HcArticle::MODEL_TYPE)
            ->whereIn('model_id', $articleIds)
            ->delete();

        // delete articles
        HcArticle::whereIn('id', $articleIds)->delete();
    }
}
