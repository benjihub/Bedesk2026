<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        \Illuminate\Support\Facades\DB::table('settings')
            ->where('name', 'landing')
            ->update(['name' => 'hcLanding']);
    }
};
