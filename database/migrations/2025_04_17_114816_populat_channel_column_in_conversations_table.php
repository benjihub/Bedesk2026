<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        DB::table('conversations')
            ->whereNotNull('received_at_email')
            ->update(['channel' => 'email']);

        DB::table('conversations')
            ->whereNull('channel')
            ->where('type', 'ticket')
            ->update(['channel' => 'website']);
    }
};
