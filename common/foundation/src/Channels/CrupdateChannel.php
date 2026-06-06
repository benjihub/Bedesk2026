<?php

namespace Common\Channels;

use App\Models\Channel;
use Illuminate\Support\Facades\Auth;

class CrupdateChannel
{
    public function execute($params, Channel $initialChannel = null): Channel
    {
        // can either specify channel model or namespace from which to instantiate
        if (!$initialChannel) {
            $channel = app(Channel::class)->newInstance([
                'user_id' => Auth::id(),
            ]);
        } else {
            $channel = $initialChannel;
        }

        $attributes = [
            'name' => $params['name'],
            'public' => $params['public'] ?? true,
            'type' => $params['type'] ?? ($channel->type ?? 'channel'),
            'description' => $params['description'] ?? null,
            // merge old config so config that is not in crupdate channel form is not lost
            'config' => array_merge(
                $initialChannel['config'] ?? [],
                $params['config'],
            ),
        ];

        if ($attributes['type'] !== 'list') {
            $attributes['slug'] = $params['slug'] ?? slugify($params['name']);
        }

        $channel
            ->fill(
                array_merge($attributes, [
                    // make sure updated_at is always changed, event if model is
                    // not dirty otherwise channel cache will not be cleared
                    'updated_at' => now(),
                ]),
            )
            ->save();

        return $channel;
    }
}
