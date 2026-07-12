import {
  BillingPlan,
  BillingSummary,
  PaymentRequest,
} from '@app/dashboard/billing/requests/billing-queries';
import {apiClient} from '@common/http/query-client';
import {queryOptions} from '@tanstack/react-query';

export interface AdminBillingAccount {
  id: number;
  name: string;
  status: 'good' | 'pending' | 'rejected';
  createdAt: string | null;
  plan: BillingPlan | null;
  subscription: {
    id: number;
    status: string;
    renewalDate: string | null;
  } | null;
  usage: {
    monthlyUsed: number;
    monthlyQuota: number;
    usagePercent: number;
    topUpBalance: number;
  };
  pendingPaymentCount: number;
  latestPendingPayment: AdminPaymentRequest | null;
}

export interface AdminPaymentRequest extends Omit<
  PaymentRequest,
  'requestedAt'
> {
  createdAt: string | null;
  expiresAt: string | null;
  provider: {
    name: string | null;
    paymentId: string | null;
    prepayId: string | null;
    status: string | null;
    invoiceUrl: string | null;
    checkoutUrl: string | null;
    qrCodeUrl: string | null;
  };
}

export const adminBillingQueries = {
  accountsKey: ['admin-billing', 'accounts'],
  accountKey: (accountId: number) => ['admin-billing', 'account', accountId],
  accounts: () =>
    queryOptions({
      queryKey: adminBillingQueries.accountsKey,
      queryFn: () =>
        apiClient
          .get<{
            accounts: AdminBillingAccount[];
          }>('helpdesk/admin/billing/accounts')
          .then(response => response.data),
    }),
  account: (accountId: number) =>
    queryOptions({
      queryKey: adminBillingQueries.accountKey(accountId),
      queryFn: () =>
        apiClient
          .get<{
            billing: BillingSummary;
          }>(`helpdesk/admin/billing/accounts/${accountId}`)
          .then(response => response.data),
    }),
};

export function confirmAdminBillingPayment(paymentRequestId: number) {
  return apiClient
    .post<{
      paymentRequest: PaymentRequest;
      billing: BillingSummary;
    }>(
      `helpdesk/admin/billing/payment-requests/${paymentRequestId}/confirm`,
      {},
    )
    .then(response => response.data);
}

export function rejectAdminBillingPayment(paymentRequestId: number) {
  return apiClient
    .post<{
      paymentRequest: PaymentRequest;
      billing: BillingSummary;
    }>(`helpdesk/admin/billing/payment-requests/${paymentRequestId}/reject`, {})
    .then(response => response.data);
}

export function reconcileAdminBillingPayment(paymentRequestId: number) {
  return apiClient
    .post<{
      paymentRequest: PaymentRequest;
      billing: BillingSummary;
    }>(
      `helpdesk/admin/billing/payment-requests/${paymentRequestId}/reconcile`,
      {},
    )
    .then(response => response.data);
}

export function expireAdminBillingTopUp(topUpId: number) {
  return apiClient
    .post<{
      billing: BillingSummary;
    }>(`helpdesk/admin/billing/top-ups/${topUpId}/expire`, {})
    .then(response => response.data);
}
