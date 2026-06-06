<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up()
    {
        foreach (DB::table('articles')->lazyById() as $article) {
            DB::table('articles')
                ->where('id', $article->id)
                ->update([
                    'body' => preg_replace(
                        '/help-center\/articles/',
                        'hc/articles',
                        $article->body,
                    ),
                ]);
        }
    }

    public function down()
    {
    }
};
