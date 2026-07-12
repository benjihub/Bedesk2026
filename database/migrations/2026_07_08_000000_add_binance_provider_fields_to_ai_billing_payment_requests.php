<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ai_billing_payment_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('ai_billing_payment_requests', 'provider')) {
                $table->string('provider')->nullable()->index()->after('transaction_hash');
            }
            if (!Schema::hasColumn('ai_billing_payment_requests', 'provider_payment_id')) {
                $table->string('provider_payment_id')->nullable()->index()->after('provider');
            }
            if (!Schema::hasColumn('ai_billing_payment_requests', 'provider_prepay_id')) {
                $table->string('provider_prepay_id')->nullable()->index()->after('provider_payment_id');
            }
            if (!Schema::hasColumn('ai_billing_payment_requests', 'provider_status')) {
                $table->string('provider_status')->nullable()->index()->after('provider_prepay_id');
            }
            if (!Schema::hasColumn('ai_billing_payment_requests', 'provider_invoice_url')) {
                $table->text('provider_invoice_url')->nullable()->after('provider_status');
            }
            if (!Schema::hasColumn('ai_billing_payment_requests', 'provider_checkout_url')) {
                $table->text('provider_checkout_url')->nullable()->after('provider_invoice_url');
            }
            if (!Schema::hasColumn('ai_billing_payment_requests', 'provider_payload')) {
                $table->json('provider_payload')->nullable()->after('provider_checkout_url');
            }
            if (!Schema::hasColumn('ai_billing_payment_requests', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('expires_at');
            }
            if (!Schema::hasColumn('ai_billing_payment_requests', 'expired_at')) {
                $table->timestamp('expired_at')->nullable()->after('paid_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ai_billing_payment_requests', function (Blueprint $table) {
            if (Schema::hasColumn('ai_billing_payment_requests', 'expired_at')) {
                $table->dropColumn('expired_at');
            }
            if (Schema::hasColumn('ai_billing_payment_requests', 'paid_at')) {
                $table->dropColumn('paid_at');
            }
            if (Schema::hasColumn('ai_billing_payment_requests', 'provider_payload')) {
                $table->dropColumn('provider_payload');
            }
            if (Schema::hasColumn('ai_billing_payment_requests', 'provider_checkout_url')) {
                $table->dropColumn('provider_checkout_url');
            }
            if (Schema::hasColumn('ai_billing_payment_requests', 'provider_invoice_url')) {
                $table->dropColumn('provider_invoice_url');
            }
            if (Schema::hasColumn('ai_billing_payment_requests', 'provider_status')) {
                $table->dropColumn('provider_status');
            }
            if (Schema::hasColumn('ai_billing_payment_requests', 'provider_prepay_id')) {
                $table->dropColumn('provider_prepay_id');
            }
            if (Schema::hasColumn('ai_billing_payment_requests', 'provider_payment_id')) {
                $table->dropColumn('provider_payment_id');
            }
            if (Schema::hasColumn('ai_billing_payment_requests', 'provider')) {
                $table->dropColumn('provider');
            }
        });
    }
};
