import {apiClient} from '@common/http/query-client';
import {queryOptions} from '@tanstack/react-query';

export type BillingStatus = 'good' | 'pending' | 'rejected';
export type AlertTone = 'info' | 'success' | 'warning' | 'critical';
export type RequestStatus = 'pending' | 'paid' | 'rejected' | 'cancelled';

export interface BillingPlan {
  id: number;
  name: string;
  slug: string;
  price: number;
  currency: string;
  quota: number;
}

export interface TopUpBatch {
  id: number;
  purchasedCredits: number;
  usedCredits: number;
  expiresAt: string | null;
  status: 'active' | 'in_use' | 'expired';
}

export interface BillingAlert {
  tone: AlertTone;
  title: string;
  message: string;
}

export interface BillingNotification {
  id: number;
  event:
    | 'payment_created'
    | 'payment_confirmed'
    | 'top_up_activated'
    | 'quota_80'
    | 'quota_90'
    | 'quota_100'
    | 'ai_stopped_exhausted';
  tone: AlertTone;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  notifiedAt: string | null;
}

export interface PaymentRequest {
  id: number;
  type: 'Plan Renewal' | 'Top-Up' | 'Plan Upgrade';
  amount: number;
  currency: string;
  requestedAt: string;
  status: RequestStatus;
  notes: string | null;
  reference: string;
  plan: BillingPlan | null;
  crypto: {
    asset: string;
    network: string;
    expectedAmount: string | null;
    receivedAmount: string | null;
    walletAddress: string | null;
    transactionHash: string | null;
    scannerUrl: string | null;
    expiresAt: string | null;
  };
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

export interface BillingSummary {
  account: {
    id: number;
    name: string;
    status: BillingStatus;
  };
  plan: BillingPlan;
  subscription: {
    id: number;
    status: string;
    cycleStart: string;
    cycleEnd: string;
    renewalDate: string;
  };
  usage: {
    monthlyUsed: number;
    monthlyRemaining: number;
  };
  topUps: TopUpBatch[];
  plans: BillingPlan[];
  pendingRequests: PaymentRequest[];
  paymentHistory: PaymentRequest[];
  notifications: BillingNotification[];
  alerts: BillingAlert[];
  topUpPackage: {
    price: number;
    credits: number;
    expiryHours: number;
  };
  crypto: {
    asset: string;
    network: string;
    walletAddress: string | null;
    scannerBaseUrl: string | null;
  };
}

export const billingQueries = {
  summaryKey: ['billing', 'summary'],
  summary: () =>
    queryOptions({
      queryKey: billingQueries.summaryKey,
      queryFn: () =>
        apiClient
          .get<{billing: BillingSummary}>('helpdesk/billing/summary')
          .then(response => response.data),
    }),
  paymentHistoryKey: ['billing', 'payment-history'],
  paymentHistory: () =>
    queryOptions({
      queryKey: billingQueries.paymentHistoryKey,
      queryFn: () =>
        apiClient
          .get<{
            paymentHistory: PaymentRequest[];
          }>('helpdesk/billing/payment-history')
          .then(response => response.data),
    }),
};

export function requestPlan(planId: number) {
  return apiClient
    .post<{
      paymentRequest: PaymentRequest;
      billing: BillingSummary;
    }>('helpdesk/billing/request-plan', {planId})
    .then(response => response.data);
}

export function requestTopUp() {
  return apiClient
    .post<{
      paymentRequest: PaymentRequest;
      billing: BillingSummary;
    }>('helpdesk/billing/request-top-up')
    .then(response => response.data);
}

export function submitBillingPaymentTransaction(
  paymentRequestId: number,
  transactionHash: string,
) {
  return apiClient
    .post<{
      paymentRequest: PaymentRequest;
      billing: BillingSummary;
    }>(`helpdesk/billing/payment-requests/${paymentRequestId}/transaction`, {
      transactionHash,
    })
    .then(response => response.data);
}

export function cancelBillingPaymentRequest(paymentRequestId: number) {
  return apiClient
    .post<{
      paymentRequest: PaymentRequest;
      billing: BillingSummary;
    }>(`helpdesk/billing/payment-requests/${paymentRequestId}/cancel`, {})
    .then(response => response.data);
}
