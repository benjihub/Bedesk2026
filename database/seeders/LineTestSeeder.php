<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Features\Line\Models\LineAccount;
use App\Features\Line\Models\LineContact;

class LineTestSeeder extends Seeder
{
    public function run()
    {
        // Create or update a test Line account
        $account = LineAccount::updateOrCreate(
            ['channel_id' => env('LINE_TEST_CHANNEL_ID', 'TEST_CHANNEL_1')],
            [
                'name' => 'Test LINE Account',
                'channel_token' => env('LINE_TEST_CHANNEL_TOKEN', null),
                'is_default' => true,
                'metadata' => ['seeded' => true],
            ]
        );

        // Create a test contact (external user) associated with the account
        LineContact::updateOrCreate(
            [
                'account_id' => $account->id,
                'external_id' => env('LINE_TEST_USER_ID', 'U_TEST_123'),
            ],
            [
                'display_name' => 'Test LINE User',
                'metadata' => ['seeded' => true],
            ]
        );
    }
}
