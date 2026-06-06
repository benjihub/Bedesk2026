<?php

namespace Common\Channels;

use App\Http\Resources\ChannelResource;
use App\Models\Channel;
use App\Services\ChannelPresets;
use Common\Core\BaseController;
use Common\Core\Prerender\Actions\ReplacePlaceholders;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ChannelController extends BaseController
{
    public function index(): Response
    {
        $this->authorize('index', [Channel::class, 'channel']);

        $pagination = (new PaginateChannels())->execute(request()->all());

        return $this->success([
            'pagination' => $pagination,
            'presets' => (new ChannelPresets())->getAll(),
        ]);
    }

    public function show(Channel $channel)
    {
        $this->authorize('show', $channel);

        $loader = request('loader', 'channelPage');

        $params = request()->all();
        if ($loader === 'editUserListPage') {
            $params['normalizeContent'] = true;
        } elseif ($loader === 'editChannelPage') {
            $params['normalizeContent'] = true;
            $params['perPage'] = $params['perPage'] ?? 100;
        }

        $channel->loadContent($params);
        if (
            $loader === 'channelPage' &&
            $channel->shouldRestrictContent() &&
            !$channel->restriction
        ) {
            abort(404);
        }

        $channel =
            $loader === 'channelPage' && class_exists(ChannelResource::class)
                ? new ChannelResource($channel)
                : $channel;

        // return only content for pagination
        if (request()->get('returnContentOnly')) {
            return [
                'pagination' => $channel->toArray(request())['content'],
            ];
        }

        $data = [
            'channel' => $channel,
            'loader' => $loader,
        ];

        if ($loader === 'channelPage') {
            $channel->config = array_merge($channel->config, [
                'selectedLayout' => Arr::get(
                    $_COOKIE,
                    "channel-layout-{$channel->config['contentModel']}",
                    false,
                ),
                'seoTitle' => isset($channel->config['seoTitle'])
                    ? app(ReplacePlaceholders::class)->execute(
                        $channel->config['seoTitle'],
                        $data,
                    )
                    : $channel->name,
                'seoDescription' => isset($channel->config['seoDescription'])
                    ? app(ReplacePlaceholders::class)->execute(
                        $channel->config['seoDescription'],
                        $data,
                    )
                    : $channel->description ?? $channel->name,
            ]);
        }

        return $this->renderClientOrApi([
            'pageName' => $loader === 'channelPage' ? 'channel-page' : null,
            'data' => [
                'channel' => $channel,
                'loader' => $loader,
            ],
        ]);
    }

    public function store(CrupdateChannelRequest $request): Response
    {
        $this->authorize('store', [Channel::class, request('type', 'channel')]);
        $this->blockOnDemoSite();

        $channel = app(CrupdateChannel::class)->execute(
            $request->validationData(),
        );

        return $this->success(['channel' => $channel]);
    }

    public function update(
        Channel $channel,
        CrupdateChannelRequest $request,
    ): Response {
        $this->authorize('update', $channel);
        $this->blockOnDemoSite();

        $channel = app(CrupdateChannel::class)->execute(
            $request->validationData(),
            $channel,
        );

        return $this->success(['channel' => $channel]);
    }

    public function destroy(string $ids): Response
    {
        $ids = explode(',', $ids);
        $channels = Channel::whereIn('id', $ids)->get();

        $this->authorize('destroy', [Channel::class, $channels]);
        $this->blockOnDemoSite();

        app(DeleteChannels::class)->execute($channels);

        return $this->success();
    }

    public function updateContent(Channel $channel): Response
    {
        $this->authorize('update', $channel);
        $this->blockOnDemoSite();

        if ($newConfig = request('channelConfig')) {
            $config = $channel->config;
            foreach ($newConfig as $key => $value) {
                $config[$key] = $value;
            }
            $channel->fill(['config' => $config])->save();
        }

        $channel->updateContentFromExternal();
        $channel->loadContent(request()->all());

        return $this->success([
            'channel' => $channel,
        ]);
    }

    public function searchForAddableContent(): Response
    {
        $namespace = modelTypeToNamespace(request('modelType'));
        $this->authorize('index', $namespace);

        $builder = app($namespace);

        if ($query = request('query')) {
            if (Str::startsWith($query, 'id:')) {
                $builder = $builder->where('id', substr($query, 3));
            } else {
                $builder = $builder->mysqlSearch($query);
            }
        }

        $results = $builder
            ->when(
                request('modelType') === 'track',
                fn($q) => $q->with(['album', 'artists']),
            )
            ->when(
                request('modelType') === 'album',
                fn($q) => $q->with('artists'),
            )
            ->take(20)
            ->get()
            ->filter(function ($result) {
                if (request('modelType') === 'channel') {
                    // exclude user lists
                    return $result->type === 'channel';
                }
                return true;
            })
            ->map(fn($result) => $result->toNormalizedArray())
            ->slice(0, request('limit', 10))
            ->values();

        return $this->success(['results' => $results]);
    }

    public function applyPreset()
    {
        $this->authorize('destroy', Channel::class);
        $this->blockOnDemoSite();

        $data = request()->validate([
            'preset' => 'required|string',
        ]);

        $ids = Channel::where('type', 'channel')->pluck('id');
        DB::table('channelables')->whereIn('channel_id', $ids)->delete();
        Channel::whereIn('id', $ids)->delete();

        (new ChannelPresets())->apply($data['preset']);

        Cache::flush();

        return $this->success();
    }
}
