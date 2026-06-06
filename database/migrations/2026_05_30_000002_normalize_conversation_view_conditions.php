<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('conversation_views')) {
            return;
        }

        DB::table('conversation_views')
            ->select('id', 'conditions')
            ->whereNotNull('conditions')
            ->orderBy('id')
            ->get()
            ->each(function ($view) {
                $normalized = $view->conditions;

                while (is_string($normalized)) {
                    $decoded = json_decode($normalized, true);

                    if (json_last_error() !== JSON_ERROR_NONE) {
                        return;
                    }

                    $normalized = $decoded;
                }

                if (!is_array($normalized)) {
                    return;
                }

                $encoded = json_encode($normalized);

                if ($encoded !== $view->conditions) {
                    DB::table('conversation_views')
                        ->where('id', $view->id)
                        ->update(['conditions' => $encoded]);
                }
            });
    }
};
