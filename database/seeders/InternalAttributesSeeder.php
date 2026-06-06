<?php

namespace Database\Seeders;

use App\Attributes\Models\CustomAttribute;
use App\Conversations\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InternalAttributesSeeder extends Seeder
{
    public function run(): void
    {
        if (
            !CustomAttribute::where('key', 'email')
                ->where('type', 'user')
                ->exists()
        ) {
            CustomAttribute::create([
                'name' => 'Email',
                'key' => 'email',
                'format' => 'email',
                'permission' => 'userCanView',
                'type' => User::MODEL_TYPE,
                'required' => true,
                'internal' => true,
                'materialized' => true,
            ]);
        }

        if (
            !CustomAttribute::where('key', 'name')
                ->where('type', 'user')
                ->exists()
        ) {
            CustomAttribute::create([
                'name' => 'Name',
                'key' => 'name',
                'format' => 'text',
                'permission' => 'userCanEdit',
                'type' => User::MODEL_TYPE,
                'required' => false,
                'internal' => true,
                'materialized' => true,
            ]);
        }

        if (
            !CustomAttribute::where('key', 'language')
                ->where('type', 'user')
                ->exists()
        ) {
            CustomAttribute::create([
                'name' => 'Language',
                'key' => 'language',
                'format' => 'dropdown',
                'permission' => 'userCanEdit',
                'type' => User::MODEL_TYPE,
                'required' => false,
                'internal' => true,
                'materialized' => true,
            ]);
        }

        if (
            !CustomAttribute::where('key', 'timezone')
                ->where('type', 'user')
                ->exists()
        ) {
            CustomAttribute::create([
                'name' => 'Timezone',
                'key' => 'timezone',
                'format' => 'dropdown',
                'permission' => 'userCanEdit',
                'type' => User::MODEL_TYPE,
                'required' => false,
                'internal' => true,
                'materialized' => true,
            ]);
        }

        if (
            !CustomAttribute::where('key', 'country')
                ->where('type', 'user')
                ->exists()
        ) {
            CustomAttribute::create([
                'name' => 'Country',
                'key' => 'country',
                'format' => 'dropdown',
                'permission' => 'userCanEdit',
                'type' => User::MODEL_TYPE,
                'required' => false,
                'internal' => true,
                'materialized' => true,
            ]);
        }

        if (
            !CustomAttribute::where('key', 'username')
                ->where('type', 'user')
                ->exists()
        ) {
            CustomAttribute::create([
                'name' => 'UserID',
                'customer_name' => 'User ID',
                'key' => 'username',
                'format' => 'text',
                'permission' => 'userCanEdit',
                'type' => User::MODEL_TYPE,
                'required' => false,
                'internal' => true,
                'materialized' => true,
            ]);
        }

        if (
            !CustomAttribute::where('key', 'group_id')
                ->where('type', 'conversation')
                ->exists()
        ) {
            CustomAttribute::create([
                'name' => 'Department',
                'format' => 'dropdown',
                'key' => 'group_id',
                'permission' => 'agentOnly',
                'type' => Conversation::MODEL_TYPE,
                'required' => false,
                'internal' => true,
                'materialized' => true,
            ]);
        }

        if (
            !CustomAttribute::where('type', 'conversation')
                ->where('key', 'rating')
                ->exists()
        ) {
            CustomAttribute::create([
                'name' => 'Rating',
                'format' => 'rating',
                'key' => 'rating',
                'permission' => 'userCanEdit',
                'type' => Conversation::MODEL_TYPE,
                'required' => false,
                'internal' => true,
                'materialized' => true,
            ]);
        }

        if (
            !CustomAttribute::where('type', 'conversation')
                ->where('key', 'category')
                ->exists()
        ) {
            CustomAttribute::create([
                'name' => 'Category',
                'customer_name' => 'Hi, what can we help you with?',
                'format' => 'dropdown',
                'key' => 'category',
                'permission' => 'userCanEdit',
                'type' => Conversation::MODEL_TYPE,
                'required' => false,
                'internal' => true,
                'config' => [
                    'options' => [
                        ['value' => 'billing', 'label' => 'Billing'],
                        ['value' => 'support', 'label' => 'Support'],
                        ['value' => 'other', 'label' => 'Other'],
                    ],
                ],
            ]);
        }

        if (
            !CustomAttribute::where('type', 'conversation')
                ->where('key', 'subject')
                ->exists()
        ) {
            CustomAttribute::create([
                'name' => 'Subject',
                'customer_name' =>
                    'In a few words, tell us what your enquiry is about',
                'format' => 'text',
                'key' => 'subject',
                'permission' => 'userCanEdit',
                'type' => Conversation::MODEL_TYPE,
                'required' => true,
                'internal' => true,
                'materialized' => true,
            ]);
        }

        $subject = CustomAttribute::firstOrCreate(
            ['key' => 'subject'],
            [
                'name' => 'Subject',
                'customer_name' =>
                    'In a few words, tell us what your enquiry is about',
                'format' => 'text',
                'key' => 'subject',
                'permission' => 'userCanEdit',
                'type' => Conversation::MODEL_TYPE,
                'required' => true,
                'internal' => true,
                'materialized' => true,
            ],
        );

        $description = CustomAttribute::firstOrCreate(
            [
                'key' => 'description',
            ],
            [
                'name' => 'Description',
                'customer_name' => 'Provide a detailed description',
                'format' => 'multiLineText',
                'key' => 'description',
                'permission' => 'userCanEdit',
                'type' => Conversation::MODEL_TYPE,
                'required' => true,
                'internal' => true,
                'materialized' => true,
            ],
        );

        // add locked attributes to new ticket page config
        $old = DB::table('settings')
            ->where('name', 'hc.newTicket.appearance')
            ->first();
        if ($old) {
            $new = json_decode($old->value, true);
            $new['attributeIds'] = $new['attributeIds'] ?? [];

            if (
                in_array($subject->id, $new['attributeIds']) &&
                in_array($description->id, $new['attributeIds'])
            ) {
                return;
            }

            $new['attributeIds'] = array_unique(
                array_merge(
                    [$subject->id, $description->id],
                    $new['attributeIds'] ?? [],
                ),
            );
            DB::table('settings')
                ->where('name', 'hc.newTicket.appearance')
                ->update(['value' => json_encode($new)]);
        }
    }
}
