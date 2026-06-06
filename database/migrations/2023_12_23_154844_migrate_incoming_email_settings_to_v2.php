<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        if (
            DB::table('settings')
                ->where('name', 'incoming_email')
                ->exists()
        ) {
            return;
        }

        // gmail
        $oldTopicName = DB::table('settings')
            ->where('name', 'gmail.incoming.topicName')
            ->first();
        $newSettings = [
            'api' => [
                'enabled' => true,
            ],
            'pipe' => [
                'enabled' => true,
            ],
        ];
        if ($oldTopicName) {
            $newSettings['gmail'] = [
                'enabled' => true,
                'topicName' => $oldTopicName->value,
            ];
        }

        if (config('services.mailgun.secret')) {
            $newSettings['mailgun'] = [
                'enabled' => true,
                'verify' => true,
            ];
        }

        DB::table('settings')->insert([
            'name' => 'incoming_email',
            'value' => encrypt(json_encode($newSettings)),
        ]);
    }

    public function down(): void
    {
    }
};
