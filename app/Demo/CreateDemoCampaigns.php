<?php

namespace App\Demo;

use App\Models\User;
use Carbon\CarbonPeriod;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Livechat\Models\Campaign;

class CreateDemoCampaigns
{
    public function execute(): void
    {
        $customers = User::where('type', 'user')->get();

        $names = collect(['welcome', 'discount', 'check-in']);
        $folder = base_path('modules/livechat/resources/campaign-templates');

        $period = CarbonPeriod::create(
            now()->startOfWeek(),
            now()->endOfWeek(),
        );

        $campaigns = $names->map(function ($name) use ($folder) {
            $template = json_decode(
                file_get_contents("$folder/$name.json"),
                true,
            );
            return Campaign::create([
                'name' => $template['label'],
                'width' => $template['width'],
                'height' => $template['height'],
                'content' => $template['content'],
                'appearance' => $template['appearance'] ?? null,
                'conditions' => $template['conditions'],
                'enabled' => false,
            ]);
        });

        // create 3 impressions per chat user per campaign
        $impressions = $customers->flatMap(
            fn(User $customer) => $campaigns->flatMap(function (
                Campaign $campaign,
            ) use ($customer, $period) {
                $impressions = [];
                for ($i = 0; $i < 3; $i++) {
                    $impressions[] = [
                        'campaign_id' => $campaign->id,
                        'user_id' => $customer->id,
                        'created_at' => Arr::random($period->toArray()),
                        'session_id' => Str::uuid(),
                        'interacted' => rand(0, 1),
                    ];
                }
                return $impressions;
            }),
        );

        foreach ($campaigns as $campaign) {
            $impressionCount = $impressions
                ->where('campaign_id', $campaign->id)
                ->count();
            $interactionCount = $impressions
                ->where('campaign_id', $campaign->id)
                ->where('interacted', true)
                ->count();
            $campaign->update([
                'impression_count' => $impressionCount,
                'interaction_count' => $interactionCount,
            ]);
        }

        DB::table('campaign_impressions')->insert($impressions->toArray());
    }
}
