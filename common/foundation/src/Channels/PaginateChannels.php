<?php

namespace Common\Channels;

use App\Models\Channel;
use Common\Database\Datasource\Datasource;
use Illuminate\Pagination\AbstractPaginator;

class PaginateChannels
{
    public function execute(array $params): AbstractPaginator
    {
        //        $builder = Channel::where('type', 'channel')->whereNotExists(function (
        //            $query,
        //        ) {
        //            $query
        //                ->select('id')
        //                ->from('channelables')
        //                ->whereColumn('channelable_id', 'channels.id');
        //        });

        $builder = Channel::where('type', 'channel');

        $paginator = new Datasource($builder, $params);

        if (!isset($params['orderBy'])) {
            $builder->orderByRaw('`internal` = "1" desc, `updated_at` desc');
            $paginator->order = false;
        }

        $pagination = $paginator->paginate();

        $pagination->transform(function (Channel $channel) {
            $channel->makeVisible(['internal']);
            return $channel;
        });

        return $pagination;
    }
}
