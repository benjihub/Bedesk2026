<?php namespace App\Billing\Controllers;

use App\Billing\Models\AiBillingAccount;
use App\Billing\Models\AiBillingPaymentRequest;
use App\Billing\Models\AiBillingPlan;
use App\Billing\Models\AiBillingTopUp;
use App\Billing\Services\AiBillingAccountResolver;
use App\Billing\Services\AiBillingPaymentRequestService;
use App\Billing\Services\AiBillingSummaryService;
use Common\Core\BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AiBillingController extends BaseController
{
    public function __construct(
        private AiBillingAccountResolver $accountResolver,
        private AiBillingSummaryService $summaryService,
        private AiBillingPaymentRequestService $paymentRequestService,
    ) {
    }

    public function summary()
    {
        $this->authorizeBillingAccess();

        $account = $this->accountResolver->resolve();

        return $this->success([
            'billing' => $this->summaryService->build($account),
        ]);
    }

    public function plans()
    {
        $this->authorizeBillingAccess();

        return $this->success([
            'plans' => AiBillingPlan::where('active', true)
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function paymentHistory()
    {
        $this->authorizeBillingAccess();

        $account = $this->accountResolver->resolve();

        return $this->success([
            'paymentHistory' => $this->summaryService->paymentHistory(
                $account,
                100,
            ),
        ]);
    }

    public function requestPlan(Request $request)
    {
        $this->authorizeBillingAccess();

        $data = $request->validate([
            'planId' => 'required|integer|exists:ai_billing_plans,id',
        ]);

        $account = $this->accountResolver->resolve();
        $plan = AiBillingPlan::findOrFail($data['planId']);
        $paymentRequest = $this->paymentRequestService->requestPlan(
            $account,
            $plan,
        );

        return $this->success(
            [
                'paymentRequest' => $this->summaryService->paymentRequest(
                    $paymentRequest->fresh('plan'),
                ),
                'billing' => $this->summaryService->build($account->fresh()),
            ],
            201,
        );
    }

    public function requestTopUp()
    {
        $this->authorizeBillingAccess();

        $account = $this->accountResolver->resolve();
        $paymentRequest = $this->paymentRequestService->requestTopUp($account);

        return $this->success(
            [
                'paymentRequest' => $this->summaryService->paymentRequest(
                    $paymentRequest->fresh('plan'),
                ),
                'billing' => $this->summaryService->build($account->fresh()),
            ],
            201,
        );
    }

    public function submitTransaction(int $paymentRequestId, Request $request)
    {
        $this->authorizeBillingAccess();

        $data = $request->validate([
            'transactionHash' => [
                'required',
                'string',
                'size:64',
                'regex:/^[A-Fa-f0-9]+$/',
            ],
        ]);

        $account = $this->accountResolver->resolve();
        $paymentRequest = $account
            ->paymentRequests()
            ->with('plan')
            ->where('status', 'pending')
            ->findOrFail($paymentRequestId);

        $paymentRequest = $this->paymentRequestService->submitTransaction(
            $paymentRequest,
            $data['transactionHash'],
        );

        return $this->success([
            'paymentRequest' => $this->summaryService->paymentRequest(
                $paymentRequest->fresh('plan'),
            ),
            'billing' => $this->summaryService->build($account->fresh()),
        ]);
    }

    public function cancelPaymentRequest(int $paymentRequestId)
    {
        $this->authorizeBillingAccess();

        $account = $this->accountResolver->resolve();
        $paymentRequest = $account
            ->paymentRequests()
            ->with('plan')
            ->where('status', 'pending')
            ->findOrFail($paymentRequestId);

        $paymentRequest->update([
            'status' => 'cancelled',
            'provider_status' => 'customer_cancelled',
            'expired_at' => now(),
            'notes' => 'Payment request cancelled by customer',
        ]);

        return $this->success([
            'paymentRequest' => $this->summaryService->paymentRequest(
                $paymentRequest->fresh('plan'),
            ),
            'billing' => $this->summaryService->build($account->fresh()),
        ]);
    }

    public function adminAccounts()
    {
        $this->authorizeAdminBillingAccess();

        $accounts = AiBillingAccount::with([
            'activeSubscription.plan',
            'paymentRequests' => fn($query) => $query
                ->with('plan')
                ->latest()
                ->limit(3),
        ])
            ->latest()
            ->limit(100)
            ->get()
            ->map(function (AiBillingAccount $account) {
                $subscription = $account->activeSubscription;
                $plan = $subscription?->plan;
                $monthlyUsed = $subscription
                    ? (int) $account
                        ->usageLedger()
                        ->where('subscription_id', $subscription->id)
                        ->sum('credits')
                    : 0;
                $monthlyQuota = (int) ($plan?->included_credits ?? 0);
                $topUpBalance = (int) $account
                    ->topUps()
                    ->where('status', 'active')
                    ->where(function ($query) {
                        $query
                            ->whereNull('expires_at')
                            ->orWhere('expires_at', '>', now());
                    })
                    ->sum(DB::raw('purchased_credits - used_credits'));
                $pendingCount = $account
                    ->paymentRequests()
                    ->where('status', 'pending')
                    ->count();
                $latestPending = $account
                    ->paymentRequests()
                    ->with('plan')
                    ->where('status', 'pending')
                    ->latest()
                    ->first();

                return [
                    'id' => $account->id,
                    'name' => $account->name,
                    'status' => $account->status,
                    'createdAt' => $account->created_at?->toIso8601String(),
                    'plan' => $plan
                        ? [
                            'id' => $plan->id,
                            'name' => $plan->name,
                            'slug' => $plan->slug,
                            'price' => $plan->monthly_price,
                            'currency' => $plan->currency,
                            'quota' => $monthlyQuota,
                        ]
                        : null,
                    'subscription' => $subscription
                        ? [
                            'id' => $subscription->id,
                            'status' => $subscription->status,
                            'renewalDate' => $subscription->renewal_date?->toDateString(),
                        ]
                        : null,
                    'usage' => [
                        'monthlyUsed' => $monthlyUsed,
                        'monthlyQuota' => $monthlyQuota,
                        'usagePercent' => $monthlyQuota
                            ? round(($monthlyUsed / $monthlyQuota) * 100)
                            : 0,
                        'topUpBalance' => $topUpBalance,
                    ],
                    'pendingPaymentCount' => $pendingCount,
                    'latestPendingPayment' => $latestPending
                        ? $this->adminPaymentRequest($latestPending)
                        : null,
                ];
            });

        return $this->success([
            'accounts' => $accounts,
        ]);
    }

    public function adminAccountSummary(int $accountId)
    {
        $this->authorizeAdminBillingAccess();

        $account = AiBillingAccount::findOrFail($accountId);

        return $this->success([
            'billing' => $this->summaryService->build($account),
        ]);
    }

    public function confirmPayment(
        int $paymentRequestId,
        Request $request,
    ) {
        $this->authorizeAdminBillingAccess();

        $data = $request->validate([
            'transactionHash' => 'nullable|string|max:255',
            'receivedAmount' => 'nullable|numeric',
        ]);

        $paymentRequest = AiBillingPaymentRequest::findOrFail(
            $paymentRequestId,
        );

        $paymentRequest = $this->paymentRequestService->confirmPayment(
            $paymentRequest,
            Auth::user(),
            $data['transactionHash'] ?? null,
            $data['receivedAmount'] ?? null,
        );

        return $this->success([
            'paymentRequest' => $this->summaryService->paymentRequest(
                $paymentRequest->fresh('plan'),
            ),
            'billing' => $this->summaryService->build($paymentRequest->account),
        ]);
    }

    public function rejectPayment(int $paymentRequestId, Request $request)
    {
        $this->authorizeAdminBillingAccess();

        $data = $request->validate([
            'notes' => 'nullable|string|max:255',
        ]);

        $paymentRequest = AiBillingPaymentRequest::findOrFail(
            $paymentRequestId,
        );
        $paymentRequest->update([
            'status' => 'rejected',
            'notes' => $data['notes'] ?? 'Crypto payment rejected',
        ]);

        return $this->success([
            'paymentRequest' => $this->summaryService->paymentRequest(
                $paymentRequest->fresh('plan'),
            ),
            'billing' => $this->summaryService->build($paymentRequest->account),
        ]);
    }

    public function reconcilePayment(int $paymentRequestId)
    {
        $this->authorizeAdminBillingAccess();

        $paymentRequest = AiBillingPaymentRequest::with('account')->findOrFail(
            $paymentRequestId,
        );
        $paymentRequest = $this->paymentRequestService->reconcilePayment(
            $paymentRequest,
        );

        return $this->success([
            'paymentRequest' => $this->summaryService->paymentRequest(
                $paymentRequest->fresh('plan'),
            ),
            'billing' => $this->summaryService->build($paymentRequest->account),
        ]);
    }

    public function expireTopUp(int $topUpId)
    {
        $this->authorizeAdminBillingAccess();

        $topUp = AiBillingTopUp::with('account')->findOrFail($topUpId);
        $topUp->update([
            'status' => 'expired',
            'expires_at' => $topUp->expires_at ?: now(),
        ]);

        return $this->success([
            'billing' => $this->summaryService->build($topUp->account),
        ]);
    }

    private function authorizeBillingAccess(): void
    {
        if (!Auth::check()) {
            abort(403);
        }
    }

    private function authorizeAdminBillingAccess(): void
    {
        $user = Auth::user();

        if (
            !$user ||
            (!$user->hasPermission('admin') &&
                !$user->hasPermission('superAdmin') &&
                !$user->hasPermission('billing.manage'))
        ) {
            abort(403);
        }
    }

    private function adminPaymentRequest(
        AiBillingPaymentRequest $request,
    ): array {
        return [
            'id' => $request->id,
            'type' => $request->type,
            'status' => $request->status,
            'amount' => $request->amount,
            'currency' => $request->currency,
            'reference' => $request->reference,
            'notes' => $request->notes,
            'createdAt' => $request->created_at?->toIso8601String(),
            'expiresAt' => $request->expires_at?->toIso8601String(),
            'provider' => [
                'name' => $request->provider,
                'paymentId' => $request->provider_payment_id,
                'prepayId' => $request->provider_prepay_id,
                'status' => $request->provider_status,
                'invoiceUrl' => $request->provider_invoice_url,
                'checkoutUrl' => $request->provider_checkout_url,
                'qrCodeUrl' => $this->summaryService->paymentRequest(
                    $request,
                )['provider']['qrCodeUrl'],
            ],
            'crypto' => $this->summaryService->paymentRequest(
                $request,
            )['crypto'],
            'plan' => $request->plan
                ? [
                    'id' => $request->plan->id,
                    'name' => $request->plan->name,
                    'slug' => $request->plan->slug,
                    'price' => $request->plan->monthly_price,
                    'currency' => $request->plan->currency,
                    'quota' => $request->plan->included_credits,
                ]
                : null,
        ];
    }
}
