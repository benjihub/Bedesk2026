<?php

use App\Attributes\Models\CustomAttribute;
use App\Conversations\Models\Conversation;
use Envato\Purchases\ImportEnvatoItems;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // create attribute, if does not exist
        $categoryAttribute = CustomAttribute::firstOrCreate(
            ['key' => 'category'],
            [
                'name' => 'Category',
                'customer_name' => 'Select the item you need help with',
                'format' => 'dropdown',
                'key' => 'category',
                'permission' => 'userCanEdit',
                'type' => 'conversation',
                'required' => true,
                'internal' => true,
            ],
        );

        // import envato items
        $envatoItems = [];
        try {
            if (config('services.envato.personal_token')) {
                $envatoItems = (new ImportEnvatoItems())->execute();
            }
        } catch (\Exception $e) {
            //
        }

        // add option to attribute for each old tag category
        $oldTagCategories = DB::table('tags')->where('type', 'category')->get();

        // get hc categories that were attached to old ticket category tags
        $hcCategories = DB::table('taggables')
            ->where('taggable_type', 'category')
            ->whereIn('tag_id', $oldTagCategories->pluck('id'))
            ->get()
            ->groupBy('tag_id')
            ->map->pluck('taggable_id');

        if (!isset($categoryAttribute->config['options'])) {
            $categoryAttribute->config = [
                'options' => [],
            ];
        }

        // add option to category attribute for each old tag category
        foreach ($oldTagCategories as $oldTagCategory) {
            $oldConfig = $categoryAttribute->config;
            $oldConfig['options'][] = [
                'value' => $oldTagCategory->name,
                'label' =>
                    $oldTagCategory->display_name ?? $oldTagCategory->name,
                'hcCategories' => $hcCategories->get($oldTagCategory->id) ?? [],
                'envatoItems' => collect($envatoItems)
                    ->filter(
                        fn($item) => slugify($oldTagCategory->name) ===
                            slugify($item->name),
                    )
                    ->pluck('id')
                    ->values(),
            ];
            $categoryAttribute->config = $oldConfig;
        }

        $categoryAttribute->save();

        // attach custom attribute based on taggables table
        foreach ($oldTagCategories as $oldTagCategory) {
            $conversationIds = DB::table('taggables')
                ->where('tag_id', $oldTagCategory->id)
                ->where('taggable_type', 'conversation')
                ->get()
                ->pluck('taggable_id');

            $conversationIds
                ->chunk(100)
                ->each(function ($chunk) use (
                    $categoryAttribute,
                    $oldTagCategory,
                ) {
                    $existingRecords = DB::table('attributables')
                        ->whereIn('attributable_id', $chunk)
                        ->where('attributable_type', 'conversation')
                        ->where('attribute_id', $categoryAttribute->id)
                        ->get()
                        ->pluck('attributable_id');

                    $filteredIds = $chunk->filter(
                        fn($id) => !$existingRecords->contains($id),
                    );

                    $records = $filteredIds->map(
                        fn($id) => [
                            'attributable_id' => $id,
                            'attributable_type' => 'conversation',
                            'attribute_id' => $categoryAttribute->id,
                            'value' => Arr::first(
                                $categoryAttribute->config['options'],
                                fn($option) => $option['value'] ===
                                    $oldTagCategory->name,
                            )['value'],
                        ],
                    );

                    DB::table('attributables')->insert($records->toArray());
                });
        }

        // create views for each category
        $slugifiedCategoryNames = DB::table('attributables')
            ->where('attribute_id', $categoryAttribute->id)
            ->distinct('value')
            ->pluck('value');

        $data = $slugifiedCategoryNames->map(function ($name) use (
            $oldTagCategories,
        ) {
            $oldTagCategory = $oldTagCategories->first(
                fn($tag) => $tag->name === $name,
            );
            $displayName = $oldTagCategory?->display_name ?? $name;

            return [
                'name' => $displayName,
                'access' => 'anyone',
                'pinned' => false,
                'active' => true,
                'order_by' => 'status_category',
                'order_dir' => 'desc',
                'conditions' => json_encode([
                    [
                        'key' => 'ca_category',
                        'match_type' => 'all',
                        'operator' => '=',
                        'value' => $name,
                    ],
                    [
                        'key' => 'status_category',
                        'match_type' => 'all',
                        'operator' => '>',
                        'value' => Conversation::STATUS_PENDING,
                    ],
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        });

        DB::table('conversation_views')->insert($data->toArray());

        // convert old category tags to default tag type
        DB::table('tags')
            ->where('type', 'category')
            ->update(['type' => 'custom']);

        // detach hc categories from old category tags
        DB::table('taggables')->where('taggable_type', 'category')->delete();
    }
};
