<?php

namespace Tests\Feature;

use App\Billing\Listeners\RecordAiReplyBillingUsage;
use App\Billing\Models\AiBillingAccount;
use App\Billing\Models\AiBillingPaymentRequest;
use App\Billing\Models\AiBillingPlan;
use App\Billing\Models\AiBillingSubscription;
use App\Billing\Models\AiBillingTopUp;
use App\Billing\Models\AiBillingUsageLedger;
use App\Billing\Services\AiBillingMaintenanceService;
use App\Billing\Services\AiBillingNotificationService;
use App\Billing\Services\AiBillingPaymentRequestService;
use App\Billing\Services\AiReplyQuotaService;
use App\Billing\Services\CryptoExchangeRateService;
use App\Billing\Services\TronSelfCustodyPaymentService;
use App\Conversations\Events\ConversationMessageCreated;
use App\Conversations\Models\Conversation;
use App\Conversations\Models\ConversationItem;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AiBillingFlowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);

        DB::purge('sqlite');
        DB::connection('sqlite')->getPdo();

        $this->createMinimalBillingSchema();
        $this->seedBillingPlans();
    }

    public function test_plan_payment_activation_after_verified_transaction(): void
    {
        $account = $this->createBillingAccount();
        $oldPlan = AiBillingPlan::where('slug', 'economy')->firstOrFail();
        $newPlan = AiBillingPlan::where('slug', 'basic')->firstOrFail();
        $oldSubscription = $this->createActiveSubscription($account, $oldPlan);

        $paymentRequest = $this->createPaymentRequest($account, [
            'plan_id' => $newPlan->id,
            'type' => 'Plan Upgrade',
            'amount' => $newPlan->monthly_price,
        ]);

        $result = $this
            ->paymentServiceWithVerifiedTron('12.500000')
            ->reconcilePayment($paymentRequest);

        $this->assertSame('paid', $result->status);
        $this->assertSame('verified', $result->provider_status);
        $this->assertSame('12.50000000', $result->received_crypto_amount);

        $this->assertDatabaseHas('ai_billing_subscriptions', [
            'id' => $oldSubscription->id,
            'status' => 'replaced',
        ]);
        $this->assertDatabaseHas('ai_billing_subscriptions', [
            'billing_account_id' => $account->id,
            'plan_id' => $newPlan->id,
            'status' => 'active',
        ]);
    }

    public function test_top_up_activation_after_verified_transaction(): void
    {
        $account = $this->createBillingAccount();
        $plan = AiBillingPlan::where('slug', 'economy')->firstOrFail();
        $this->createActiveSubscription($account, $plan);

        $paymentRequest = $this->createPaymentRequest($account, [
            'type' => 'Top-Up',
            'amount' => config('ai-billing.top_up_price'),
        ]);

        $result = $this
            ->paymentServiceWithVerifiedTron('60.000000')
            ->reconcilePayment($paymentRequest);

        $this->assertSame('paid', $result->status);
        $this->assertDatabaseHas('ai_billing_top_ups', [
            'billing_account_id' => $account->id,
            'payment_request_id' => $paymentRequest->id,
            'purchased_credits' => config('ai-billing.top_up_credits'),
            'used_credits' => 0,
            'status' => 'active',
        ]);
    }

    public function test_payment_requests_get_unique_exact_crypto_amounts(): void
    {
        config([
            'ai-billing.crypto_asset' => 'USDT',
            'ai-billing.crypto_network' => 'TRC20',
            'ai-billing.crypto_wallet_address' => 'TTestWalletAddress',
            'ai-billing.payment_provider' => 'tron_self_custody',
        ]);

        $account = $this->createBillingAccount();

        $first = $this
            ->paymentServiceWithQuote('10')
            ->requestTopUp($account);
        $second = $this
            ->paymentServiceWithQuote('10')
            ->requestTopUp($account);

        $this->assertSame('10.01000000', $first->expected_crypto_amount);
        $this->assertSame('10.02000000', $second->expected_crypto_amount);
        $this->assertNotSame(
            $first->expected_crypto_amount,
            $second->expected_crypto_amount,
        );
        $this->assertTrue(
            $second->provider_payload['uniqueAmount']['exactAmountRequired'],
        );
    }

    public function test_successful_bot_message_increments_ai_usage_once(): void
    {
        $account = $this->createBillingAccount();
        $plan = AiBillingPlan::where('slug', 'economy')->firstOrFail();
        $subscription = $this->createActiveSubscription($account, $plan);
        $conversation = new Conversation([
            'id' => 123,
            'group_id' => null,
            'mode' => Conversation::MODE_NORMAL,
        ]);
        $message = new ConversationItem([
            'id' => 456,
            'type' => 'message',
            'author' => Conversation::AUTHOR_BOT,
            'body' => 'Successful AI reply.',
        ]);

        $event = new ConversationMessageCreated($conversation, $message);
        $listener = app(RecordAiReplyBillingUsage::class);

        $listener->handle($event);
        $listener->handle($event);

        $this->assertSame(1, AiBillingUsageLedger::count());
        $this->assertDatabaseHas('ai_billing_usage_ledger', [
            'billing_account_id' => $account->id,
            'subscription_id' => $subscription->id,
            'message_id' => $message->id,
            'usage_type' => 'ai_reply',
            'credits' => 1,
        ]);
    }

    public function test_ai_quota_stops_when_monthly_and_top_up_credits_are_exhausted(): void
    {
        $account = $this->createBillingAccount();
        $plan = AiBillingPlan::create([
            'name' => 'Tiny',
            'slug' => 'tiny',
            'monthly_price' => 1,
            'included_credits' => 1,
            'sort_order' => 1,
            'active' => true,
        ]);
        $this->createActiveSubscription($account, $plan);
        $quota = app(AiReplyQuotaService::class);

        $this->assertTrue($quota->canConsume($account));

        $quota->recordSuccessfulReply($account, ['message_id' => 9001]);

        $this->assertFalse($quota->canConsume($account));

        $topUp = AiBillingTopUp::create([
            'billing_account_id' => $account->id,
            'purchased_credits' => 1,
            'used_credits' => 0,
            'status' => 'active',
            'activated_at' => now(),
            'expires_at' => now()->addDay(),
        ]);

        $this->assertTrue($quota->canConsume($account));

        $quota->recordSuccessfulReply($account, ['message_id' => 9002]);

        $this->assertSame(1, $topUp->fresh()->used_credits);
        $this->assertFalse($quota->canConsume($account));
    }

    public function test_maintenance_expires_payment_requests_and_top_ups(): void
    {
        $account = $this->createBillingAccount();
        $plan = AiBillingPlan::where('slug', 'economy')->firstOrFail();
        $this->createActiveSubscription($account, $plan);
        $paymentRequest = $this->createPaymentRequest($account, [
            'expires_at' => now()->subMinute(),
        ]);
        $topUp = AiBillingTopUp::create([
            'billing_account_id' => $account->id,
            'purchased_credits' => 10,
            'used_credits' => 0,
            'status' => 'active',
            'activated_at' => now()->subDay(),
            'expires_at' => now()->subMinute(),
        ]);

        $result = app(AiBillingMaintenanceService::class)->run();

        $this->assertSame(1, $result['expiredPaymentRequests']);
        $this->assertSame(1, $result['expiredTopUps']);
        $this->assertSame('cancelled', $paymentRequest->fresh()->status);
        $this->assertSame('expired', $paymentRequest->fresh()->provider_status);
        $this->assertSame('expired', $topUp->fresh()->status);
    }

    private function createBillingAccount(): AiBillingAccount
    {
        return AiBillingAccount::create([
            'owner_user_id' => null,
            'name' => 'Test Billing Account',
            'status' => 'good',
        ]);
    }

    private function createActiveSubscription(
        AiBillingAccount $account,
        AiBillingPlan $plan,
    ): AiBillingSubscription {
        return AiBillingSubscription::create([
            'billing_account_id' => $account->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'cycle_start' => now()->toDateString(),
            'cycle_end' => now()->addMonthNoOverflow()->subDay()->toDateString(),
            'renewal_date' => now()->addMonthNoOverflow()->toDateString(),
            'activated_at' => now(),
        ]);
    }

    private function createPaymentRequest(
        AiBillingAccount $account,
        array $overrides = [],
    ): AiBillingPaymentRequest {
        return AiBillingPaymentRequest::create([
            'billing_account_id' => $account->id,
            'type' => 'Plan Upgrade',
            'status' => 'pending',
            'amount' => 750000,
            'currency' => 'IDR',
            'reference' => 'AIB-TEST-' . str()->random(8),
            'crypto_asset' => 'USDT',
            'crypto_network' => 'TRC20',
            'expected_crypto_amount' => '10.000000',
            'wallet_address' => 'TTestWalletAddress',
            'transaction_hash' => str_repeat('a', 64),
            'provider' => 'tron_self_custody',
            'provider_status' => 'transaction_submitted',
            'expires_at' => now()->addDay(),
            ...$overrides,
        ]);
    }

    private function paymentServiceWithVerifiedTron(
        string $receivedAmount,
    ): AiBillingPaymentRequestService {
        return new AiBillingPaymentRequestService(
            app(CryptoExchangeRateService::class),
            new class ($receivedAmount) extends TronSelfCustodyPaymentService {
                public function __construct(private string $receivedAmount)
                {
                }

                public function verify(AiBillingPaymentRequest $paymentRequest): array
                {
                    return [
                        'verified' => true,
                        'status' => 'verified',
                        'message' => 'TRON payment verified.',
                        'receivedAmount' => $this->receivedAmount,
                        'transactionHash' => $paymentRequest->transaction_hash,
                        'payload' => ['txID' => $paymentRequest->transaction_hash],
                    ];
                }
            },
            app(AiBillingNotificationService::class),
        );
    }

    private function paymentServiceWithQuote(
        string $quotedAmount,
    ): AiBillingPaymentRequestService {
        return new AiBillingPaymentRequestService(
            new class ($quotedAmount) extends CryptoExchangeRateService {
                public function __construct(private string $quotedAmount)
                {
                }

                public function quote(
                    int $fiatAmount,
                    string $fiatCurrency,
                    string $cryptoAsset,
                ): array {
                    return [
                        'amount' => $this->quotedAmount,
                        'asset' => strtoupper($cryptoAsset),
                        'rate' => '1',
                        'source' => 'test',
                    ];
                }
            },
            app(TronSelfCustodyPaymentService::class),
            app(AiBillingNotificationService::class),
        );
    }

    private function createMinimalBillingSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->increments('id');
            $table->string('type')->nullable();
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 30)->unique();
            $table->string('group', 30)->nullable();
            $table->timestamps();
        });

        Schema::create('permissionables', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('permission_id')->index();
            $table->integer('permissionable_id')->index();
            $table->string('permissionable_type', 40)->index();
            $table->text('restrictions')->nullable();
        });

        Schema::create('ai_billing_plans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedInteger('monthly_price');
            $table->string('currency', 8)->default('IDR');
            $table->string('interval')->default('month');
            $table->unsignedInteger('included_credits');
            $table->boolean('active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('ai_billing_accounts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('owner_user_id')->nullable()->index();
            $table->string('name');
            $table->string('status')->default('good')->index();
            $table->timestamps();
        });

        Schema::create('ai_billing_subscriptions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('billing_account_id')->index();
            $table->unsignedBigInteger('plan_id')->index();
            $table->string('status')->default('active')->index();
            $table->date('cycle_start');
            $table->date('cycle_end');
            $table->date('renewal_date');
            $table->timestamp('activated_at')->nullable();
            $table->timestamps();
        });

        Schema::create('ai_billing_payment_requests', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('billing_account_id')->index();
            $table->unsignedBigInteger('plan_id')->nullable()->index();
            $table->string('type')->index();
            $table->string('status')->default('pending')->index();
            $table->unsignedInteger('amount');
            $table->string('currency', 8)->default('IDR');
            $table->string('reference')->unique();
            $table->string('crypto_asset', 20)->default('USDT');
            $table->string('crypto_network', 40)->default('TRC20');
            $table->decimal('expected_crypto_amount', 20, 8)->nullable();
            $table->decimal('received_crypto_amount', 20, 8)->nullable();
            $table->string('wallet_address')->nullable();
            $table->string('transaction_hash')->nullable()->index();
            $table->string('provider')->nullable()->index();
            $table->string('provider_status')->nullable()->index();
            $table->json('provider_payload')->nullable();
            $table->string('notes')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->unsignedInteger('confirmed_by')->nullable()->index();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('ai_billing_top_ups', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('billing_account_id')->index();
            $table->unsignedBigInteger('payment_request_id')->nullable()->index();
            $table->unsignedInteger('purchased_credits');
            $table->unsignedInteger('used_credits')->default(0);
            $table->string('status')->default('active')->index();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('ai_billing_usage_ledger', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('billing_account_id')->index();
            $table->unsignedBigInteger('subscription_id')->nullable()->index();
            $table->unsignedBigInteger('top_up_id')->nullable()->index();
            $table->unsignedInteger('conversation_id')->nullable()->index();
            $table->unsignedBigInteger('ai_agent_id')->nullable()->index();
            $table->unsignedInteger('message_id')->nullable()->index();
            $table->string('usage_type')->default('ai_reply')->index();
            $table->unsignedInteger('credits')->default(1);
            $table->timestamps();
        });

        Schema::create('ai_billing_notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('billing_account_id')->index();
            $table->string('event')->index();
            $table->string('tone')->default('info')->index();
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable();
            $table->string('dedupe_key')->nullable()->unique();
            $table->timestamp('notified_at')->nullable()->index();
            $table->timestamps();
        });
    }

    private function seedBillingPlans(): void
    {
        AiBillingPlan::insert([
            [
                'name' => 'Economy',
                'slug' => 'economy',
                'monthly_price' => 750000,
                'included_credits' => 7500,
                'sort_order' => 10,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'monthly_price' => 2500000,
                'included_credits' => 30000,
                'sort_order' => 20,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
