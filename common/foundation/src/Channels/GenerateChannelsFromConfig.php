<?php

namespace Common\Channels;

use App\Models\Channel;
use App\Models\User;
use Illuminate\Support\Arr;

class GenerateChannelsFromConfig
{
    public function execute(array $configPaths): Channel|null
    {
        $createdChannels = [];

        $configs = collect($configPaths)
            ->map(
                fn($configPath) => json_decode(
                    file_get_contents($configPath),
                    true,
                ),
            )
            ->flatten(1)
            ->sortBy(fn($config) => !empty($config['nestedChannels']));

        foreach ($configs as $config) {
            $nestedChannelSlugs = Arr::pull($config, 'nestedChannels');
            $presetDescription = Arr::pull($config, 'presetDescription');
            $config['config']['adminDescription'] = $presetDescription;
            $channel = Channel::create(
                array_merge($config, [
                    'type' => 'channel',
                    'public' => true,
                    'internal' => $config['internal'] ?? false,
                    'user_id' => app(User::class)->findAdmin()?->id ?? 1,
                ]),
            );
            $createdChannels[] = [
                'parent' => $channel,
                'nestedChannelSlugs' => $nestedChannelSlugs,
            ];
        }

        foreach ($createdChannels as $createdChannel) {
            if (isset($createdChannel['nestedChannelSlugs'])) {
                foreach ($createdChannel['nestedChannelSlugs'] as $slug) {
                    $nestedChannel = Channel::where('slug', $slug)->first();
                    $createdChannel['parent']
                        ->channels()
                        ->attach($nestedChannel->id);
                }
            }
        }

        return Channel::whereIn('slug', ['homepage', 'discover'])->first();
    }
}
