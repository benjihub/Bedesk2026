<?php

namespace App\Demo;

use App\Conversations\Models\Conversation;
use Common\Tags\Tag;
use Illuminate\Support\Facades\DB;

class CreateDemoTags
{
    public function execute(): void
    {
        $tags = collect([
            'PreSales',
            'Support',
            'Billing',
            'Demo',
            'Order',
            'Feature',
            'Login',
            'Subscription',
            'Refund',
            'Payment',
            'Downtime',
            'Customization',
            'Shipping',
            'Pricing',
            'Onboarding',
            'Inquiry',
            'Feedback',
            'Cancellation',
            'Discount',
            'Partnership',
        ])->map(
            fn(string $name) => [
                'name' => slugify($name),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        Tag::insert($tags->toArray());
        $tags = Tag::get();

        $data = [];
        foreach (Conversation::get() as $conversation) {
            $tagIds = $tags->random(rand(1, 4))->pluck('id');
            foreach ($tagIds as $tagId) {
                $data[] = [
                    'taggable_id' => $conversation->id,
                    'taggable_type' => Conversation::MODEL_TYPE,
                    'tag_id' => $tagId,
                ];
            }
        }

        DB::table('taggables')->insert($data);
    }
}
