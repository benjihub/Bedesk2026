<?php

namespace Common\Channels;

use App\Models\Channel;
use Common\Core\BaseController;
use Illuminate\Support\Facades\DB;

class ChannelContentOrderController extends BaseController
{
    public function changeOrder(int $channelId)
    {
        $channel = Channel::findOrFail($channelId);

        $this->authorize('update', $channel);
        $this->blockOnDemoSite();

        $data = request()->validate([
            'ids' => 'array|min:1',
            'ids.*' => 'int',
            'modelType' => 'required|string',
        ]);

        $queryPart = '';
        foreach ($data['ids'] as $order => $id) {
            $queryPart .= " when channelable_id=$id then $order";
        }

        DB::table('channelables')
            ->where('channel_id', $channel->id)
            ->whereIn('channelable_id', $data['ids'])
            ->where('channelable_type', $data['modelType'])
            ->update(['order' => DB::raw("(case $queryPart end)")]);

        // update timestamp to trigger cache invalidation
        $channel->touch();

        return $this->success();
    }
}
