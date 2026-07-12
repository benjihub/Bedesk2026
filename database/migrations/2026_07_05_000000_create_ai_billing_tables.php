<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
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

            $table
                ->foreign('owner_user_id')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
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

            $table
                ->foreign('billing_account_id')
                ->references('id')
                ->on('ai_billing_accounts')
                ->cascadeOnDelete();
            $table
                ->foreign('plan_id')
                ->references('id')
                ->on('ai_billing_plans')
                ->restrictOnDelete();
        });

        Schema::create('ai_billing_payment_requests', function (
            Blueprint $table,
        ) {
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
            $table->string('provider_payment_id')->nullable()->index();
            $table->string('provider_prepay_id')->nullable()->index();
            $table->string('provider_status')->nullable()->index();
            $table->text('provider_invoice_url')->nullable();
            $table->text('provider_checkout_url')->nullable();
            $table->json('provider_payload')->nullable();
            $table->string('notes')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->unsignedInteger('confirmed_by')->nullable()->index();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();

            $table
                ->foreign('billing_account_id')
                ->references('id')
                ->on('ai_billing_accounts')
                ->cascadeOnDelete();
            $table
                ->foreign('plan_id')
                ->references('id')
                ->on('ai_billing_plans')
                ->nullOnDelete();
            $table
                ->foreign('confirmed_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
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

            $table
                ->foreign('billing_account_id')
                ->references('id')
                ->on('ai_billing_accounts')
                ->cascadeOnDelete();
            $table
                ->foreign('payment_request_id')
                ->references('id')
                ->on('ai_billing_payment_requests')
                ->nullOnDelete();
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

            $table
                ->foreign('billing_account_id')
                ->references('id')
                ->on('ai_billing_accounts')
                ->cascadeOnDelete();
            $table
                ->foreign('subscription_id')
                ->references('id')
                ->on('ai_billing_subscriptions')
                ->nullOnDelete();
            $table
                ->foreign('top_up_id')
                ->references('id')
                ->on('ai_billing_top_ups')
                ->nullOnDelete();
        });

        DB::table('ai_billing_plans')->insert([
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
            [
                'name' => 'Premium',
                'slug' => 'premium',
                'monthly_price' => 4000000,
                'included_credits' => 90000,
                'sort_order' => 30,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'monthly_price' => 8000000,
                'included_credits' => 300000,
                'sort_order' => 40,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_billing_usage_ledger');
        Schema::dropIfExists('ai_billing_top_ups');
        Schema::dropIfExists('ai_billing_payment_requests');
        Schema::dropIfExists('ai_billing_subscriptions');
        Schema::dropIfExists('ai_billing_accounts');
        Schema::dropIfExists('ai_billing_plans');
    }
};
