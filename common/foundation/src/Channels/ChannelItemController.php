<?php

namespace Common\Channels;

use App\Models\Channel;
use Common\Core\BaseController;
use Illuminate\Support\Str;

class ChannelItemController extends BaseController
{
    public function add(Channel $channel)
    {
        $this->authorize('update', $channel);
        $this->blockOnDemoSite();

        $data = $this->validate(request(), [
            'itemId' => 'required|integer',
            'itemType' => 'required|string',
        ]);

        $relationName = Str::plural($data['itemType']);

        $channel->$relationName()->sync(
            [
                $data['itemId'] => [
                    'order' => $channel->$relationName()->count() + 1,
                    'created_at' => now(),
                ],
            ],
            false,
        );
        $channel->touch();

        return $this->success(['channel' => $channel]);
    }

    public function remove(Channel $channel)
    {
        $this->authorize('update', $channel);
        $this->blockOnDemoSite();

        $data = $this->validate(request(), [
            'itemId' => 'required|integer',
            'itemType' => 'required|string',
        ]);

        $relationName = Str::plural($data['itemType']);
        $channel->$relationName()->detach($data['itemId']);
        $channel->touch();

        return $this->success(['channel' => $channel]);
    }
}
