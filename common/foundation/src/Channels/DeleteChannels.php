<?php

namespace Common\Channels;

use App\Models\Channel;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DeleteChannels
{
    public function execute(Collection $channels, bool $force = false): int
    {
        if (
            !$force &&
            $channels->some(
                fn(Channel $channel) => $channel->internal ||
                    Arr::get($channel->config, 'preventDeletion'),
            )
        ) {
            abort(422, __("Internal channels can't be deleted"));
        }

        if (
            settings('homepage.type') === 'channels' &&
            $channels->contains('id', (int) settings('homepage.value'))
        ) {
            abort(422, __('You can not delete the homepage channel'));
        }

        $channelIds = $channels->pluck('id')->toArray();

        // touch all channels that have channels we're deleting
        // nested so cache for them is cleared properly
        $parentChannelIds = DB::table('channelables')
            ->where('channelable_type', Channel::MODEL_TYPE)
            ->whereIn('channelable_id', $channelIds)
            ->pluck('channel_id');
        Channel::whereIn('id', $parentChannelIds)->update([
            'updated_at' => Carbon::now(),
        ]);

        DB::table('channelables')
            ->whereIn('channel_id', $channelIds)
            ->delete();
        Channel::whereIn('id', $channelIds)->delete();

        return count($channelIds);
    }
}
