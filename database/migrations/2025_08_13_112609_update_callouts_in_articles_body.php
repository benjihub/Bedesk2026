<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        foreach (DB::table('articles')->cursor() as $article) {
            DB::table('articles')
                ->where('id', $article->id)
                ->update([
                    'body' => str_replace(
                        '<div class="title">Important:</div>',
                        '',
                        $article->body,
                    ),
                ]);
        }
    }
};
