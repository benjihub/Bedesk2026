<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $old = DB::table('settings')
            ->where('name', 'hc.header.appearance')
            ->first();

        if (!$old) {
            return;
        }

        $old = json_decode($old->value, true);

        $new = [
            'header' => [
                'title' => $old['title'],
                'subtitle' => $old['subtitle'],
                'placeholder' => $old['placeholder'],
                'background' => $old['background'],
                'variant' => 'colorful',
            ],
            'content' => [
                'variant' => 'articleGrid',
            ],
        ];

        DB::table('settings')->insert([
            'name' => 'landing',
            'value' => json_encode($new),
        ]);

        DB::table('settings')
            ->where('name', 'hc.header.appearance')
            ->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
