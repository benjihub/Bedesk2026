<?php namespace Envato\Http\Controllers;

use App\Conversations\Models\Conversation;
use App\Models\User;
use Common\Core\BaseController;
use Envato\EnvatoApiClient;
use Envato\Models\EnvatoItem;
use Envato\Purchases\ImportEnvatoItems;
use Envato\Purchases\UserEnvatoPurchases;
use Envato\Reports\EnvatoReportBuilder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;

class EnvatoController extends BaseController
{
    public function validateCode()
    {
        $this->authorize('index', Conversation::class);
        $this->blockOnDemoSite();

        $code = request('purchase_code');

        if ($purchase = (new EnvatoApiClient())->getPurchaseByCode($code)) {
            return $this->success([
                'valid' => !!$purchase,
                'code' => $purchase,
            ]);
        } else {
            return $this->error(__('This purchase code is not valid.'));
        }
    }

    public function addPurchaseUsingCode(User $user)
    {
        $this->authorize('update', $user);
        $this->blockOnDemoSite();

        $data = $this->validate(request(), [
            'purchaseCode' => 'required|string',
        ]);

        $envatoPurchase = (new EnvatoApiClient())->getPurchaseByCode(
            $data['purchaseCode'],
        );

        if (!$envatoPurchase) {
            return $this->error(__('There was an issue'), [
                'purchaseCode' => __('Could not find purchase with this code.'),
            ]);
        }

        $purchase = (new UserEnvatoPurchases($user))->addUsingCode(
            $envatoPurchase['code'],
        );

        return $this->success(['purchase' => $purchase]);
    }

    public function syncPurchases(User $user)
    {
        $this->authorize('update', $user);
        $this->blockOnDemoSite();

        (new UserEnvatoPurchases($user))->sync();

        return $this->success(['purchases' => $user->purchaseCodes]);
    }

    public function importItems()
    {
        $this->authorize('index', Conversation::class);
        $this->blockOnDemoSite();

        $items = (new ImportEnvatoItems())->execute();

        return $this->success(['items' => $items]);
    }

    public function envatoReport()
    {
        $this->authorize('show', 'ReportPolicy');
        $this->blockOnDemoSite();

        $report = (new EnvatoReportBuilder())->execute(request()->all());

        return $this->success($report);
    }
}
