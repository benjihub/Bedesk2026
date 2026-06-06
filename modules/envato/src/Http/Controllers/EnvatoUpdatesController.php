<?php namespace Envato\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Common\Core\BaseController;
use Common\Files\Uploads\Uploads;
use Common\Files\Uploads\UploadType;
use Envato\EnvatoApiClient;
use Envato\Models\EnvatoItem;
use Envato\Models\PurchaseCode;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class EnvatoUpdatesController extends BaseController
{
    public function registerPurchaseCode()
    {
        $data = $this->validate(request(), [
            'purchase_code' => 'required|string',
            'item_id' => 'required|integer',
            'domain' => 'required|string',
        ]);

        $purchase = (new EnvatoApiClient())->getPurchaseByCode(
            $data['purchase_code'],
        );

        if (!$purchase) {
            $msg = __('This purchase code is not valid.');
            return $this->error($msg, ['purchase_code' => $msg]);
        }

        if ((int) $data['item_id'] !== (int) $purchase['item_id']) {
            $msg = __('This purchase code is for a different item.');
            return $this->error($msg, ['purchase_code' => $msg]);
        }

        $existingPurchase = PurchaseCode::where(
            'code',
            $data['purchase_code'],
        )->first();

        if ($existingPurchase) {
            $existingPurchase->update([
                'domain' => $data['domain'],
            ]);
        } else {
            PurchaseCode::create([...$purchase, 'domain' => $data['domain']]);
        }

        return $this->success(['purchase_code' => $purchase['code']]);
    }

    public function getLatestVersion()
    {
        $data = $this->validate(request(), [
            'purchase_code' => 'required|string',
        ]);

        $purchase = (new EnvatoApiClient())->getPurchaseByCode(
            $data['purchase_code'],
        );

        if (!$purchase) {
            return $this->error(__('This purchase code is not valid.'));
        }

        $item = EnvatoItem::where(
            'item_id',
            $purchase['item_id'],
        )->firstOrFail();

        return $this->success([
            'latest_version' => $item['latest_version'],
        ]);
    }

    public function getUpdateDownloadUrl()
    {
        $data = $this->validate(request(), [
            'purchase_code' => 'required|string',
        ]);

        $purchase = (new EnvatoApiClient())->getPurchaseByCode(
            $data['purchase_code'],
        );

        if (!$purchase) {
            return $this->error(__('This purchase code is not valid.'));
        }

        $backend = Uploads::backend(
            config('modules.envato.updates_backend_id'),
        );
        $type = new UploadType('envato-updates', [
            'backends' => [$backend->id],
        ]);
        $disk = Uploads::disk($type, $backend);

        $allUpdates = $disk->files();
        $latestUpdate = collect($allUpdates)
            ->map(function ($path) {
                $fileName = basename($path);
                $parts = explode('-', $fileName);

                if (count($parts) === 3) {
                    // main app: bedesk-3.0.6-20484131.zip
                    return [
                        'name' => $parts[0],
                        'version' => $parts[1],
                        'item_id' => (int) $parts[2],
                        'path' => $path,
                    ];
                } else {
                    // it's an addon: bedesk-3.0.6-livechat-59719106.zip
                    return [
                        'name' => $parts[2],
                        'version' => $parts[1],
                        'item_id' => (int) $parts[3],
                        'path' => $path,
                    ];
                }
            })
            ->filter(fn($update) => $update['item_id'] === $purchase['item_id'])
            ->sortByDesc(fn($update) => $update['version'])
            ->first();
        $latestUpdatePath = $latestUpdate['path'] ?? null;

        if (
            !$latestUpdatePath ||
            !$disk->exists($latestUpdatePath) ||
            !($size = $disk->size($latestUpdatePath))
        ) {
            return $this->error(
                __(
                    'There was an issue with downloading update file. Please try again later.',
                ),
            );
        }

        $downloadUrl = $disk->temporaryUrl(
            $latestUpdatePath,
            Carbon::now()->addMinutes(30),
        );

        return $this->success([
            'download_url' => $downloadUrl,
            'file_size' => $size,
        ]);
    }

    public function updateItem(int $envatoItemId)
    {
        Gate::allowIf(fn(User $user) => $user->hasPermission('admin'));
        $this->blockOnDemoSite();

        $data = $this->validate(request(), [
            'latest_version' => 'string',
        ]);

        $item = EnvatoItem::where('item_id', $envatoItemId)->firstOrFail();
        $item->fill($data)->save();

        return $this->success(['item' => $item]);
    }
}
