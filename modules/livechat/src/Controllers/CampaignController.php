<?php

namespace Livechat\Controllers;

use Common\Core\BaseController;
use Common\Database\Datasource\Datasource;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\Rules\Unique;
use Livechat\Actions\BuildCampaignReport;
use Livechat\Models\Campaign;
use SplFileInfo;

class CampaignController extends BaseController
{
    public function index()
    {
        $this->authorize('index', Campaign::class);

        $pagination = (new Datasource(
            Campaign::query(),
            request()->all(),
        ))->paginate();

        return $this->success(['pagination' => $pagination]);
    }

    public function show(int $campaignId)
    {
        $campaign = Campaign::findOrFail($campaignId);

        $this->authorize('show', $campaign);

        return $this->success(['campaign' => $campaign]);
    }

    public function store()
    {
        $this->authorize('store', Campaign::class);

        $data = request()->validate(
            [
                'name' => 'required|string|unique:campaigns',
                'content' => 'array',
                'conditions' => 'array',
                'appearance' => 'array',
                'width' => 'required|numeric',
                'height' => 'required|numeric',
            ],
            [
                'content' => __('At least one content item is required.'),
                'conditions' => __('At least one condition is required.'),
            ],
        );

        $campaign = Campaign::create($data);
        $campaign->syncContentEntries();

        return $this->success(['campaign' => $campaign]);
    }

    public function update(int $campaignId)
    {
        $campaign = Campaign::findOrFail($campaignId);

        $this->authorize('update', $campaign);

        $data = request()->validate(
            [
                'name' => [
                    'string',
                    (new Unique('campaigns', 'name'))->ignore($campaign),
                ],
                'enabled' => 'boolean',
                'content' => 'sometimes|required|array',
                'conditions' => 'sometimes|required|array',
                'appearance' => 'array',
                'width' => 'numeric',
                'height' => 'numeric',
            ],
            [
                'content' => __('At least one content item is required.'),
                'conditions' => __('At least one condition is required.'),
            ],
        );

        $campaign->update($data);
        $campaign->syncContentEntries();

        return $this->success(['campaign' => $campaign]);
    }

    public function destroy(string $ids)
    {
        $ids = explode(',', $ids);

        $this->authorize('destroy', Campaign::class);

        $campaigns = Campaign::whereIn('id', $ids)->get();

        foreach ($campaigns as $campaign) {
            $campaign->contentEntries()->detach();
            $campaign->delete();
        }

        return $this->success();
    }

    public function report(int $campaignId)
    {
        $campaign = Campaign::select(['id', 'name'])->findOrFail($campaignId);

        $this->authorize('show', $campaign);

        $report = (new BuildCampaignReport())->execute([
            'campaignId' => $campaignId,
            'startDate' => request('startDate'),
            'endDate' => request('endDate'),
            'timezone' => request('timezone'),
            'country' => request('country'),
        ]);

        return $this->success(['report' => $report, 'campaign' => $campaign]);
    }

    public function templates()
    {
        $this->authorize('store', Campaign::class);

        $templates = collect(
            File::allFiles(__DIR__ . '/../../resources/campaign-templates'),
        )
            ->filter(fn(SplFileInfo $file) => $file->getExtension() === 'json')
            ->map(
                fn(SplFileInfo $file) => json_decode(
                    File::get($file->getPathname()),
                    true,
                ),
            )
            ->sortBy('label')
            ->values();

        return $this->success(['templates' => $templates]);
    }
}
