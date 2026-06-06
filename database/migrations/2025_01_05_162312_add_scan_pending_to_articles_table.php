<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $table
                ->boolean('used_by_ai_agent')
                ->default(false)
                ->after('author_id')
                ->index();
            $table
                ->boolean('scan_pending')
                ->default(false)
                ->after('author_id')
                ->index();
            $table
                ->timestamp('scan_started_at')
                ->nullable()
                ->index()
                ->after('updated_at');
        });
    }
};
