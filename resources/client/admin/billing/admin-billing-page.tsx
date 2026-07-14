import {
  AdminBillingAccount,
  adminBillingQueries,
  expireAdminBillingTopUp,
  rejectAdminBillingPayment,
  reconcileAdminBillingPayment,
} from '@app/admin/billing/admin-billing-queries';
import {
  BillingSummary,
  PaymentRequest,
  RequestStatus,
  TopUpBatch,
} from '@app/dashboard/billing/requests/billing-queries';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {queryClient} from '@common/http/query-client';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {AddCardIcon} from '@ui/icons/material/AddCard';
import {AutoAwesomeIcon} from '@ui/icons/material/AutoAwesome';
import {CheckCircleIcon} from '@ui/icons/material/CheckCircle';
import {CreditScoreIcon} from '@ui/icons/material/CreditScore';
import {ErrorOutlineIcon} from '@ui/icons/material/ErrorOutline';
import {InfoIcon} from '@ui/icons/material/Info';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {PaymentsIcon} from '@ui/icons/material/Payments';
import {ReceiptLongIcon} from '@ui/icons/material/ReceiptLong';
import {RefreshIcon} from '@ui/icons/material/Refresh';
import {WarningAmberIcon} from '@ui/icons/material/WarningAmber';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {ProgressBar} from '@ui/progress/progress-bar';
import {Skeleton} from '@ui/skeleton/skeleton';
import {toast} from '@ui/toast/toast';
import {useMutation, useQuery} from '@tanstack/react-query';
import clsx from 'clsx';
import {ReactNode, useEffect, useState} from 'react';

export function Component() {
  const accountsQuery = useQuery(adminBillingQueries.accounts());
  const accounts = accountsQuery.data?.accounts ?? [];
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!selectedAccountId && accounts.length) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const selectedAccount =
    accounts.find(account => account.id === selectedAccountId) ?? accounts[0];

  const detailQuery = useQuery({
    ...adminBillingQueries.account(selectedAccount?.id || 0),
    enabled: !!selectedAccount,
  });

  const billing = detailQuery.data?.billing;
  const pendingPayments = billing?.pendingRequests ?? [];
  const allPendingCount = accounts.reduce(
    (total, account) => total + account.pendingPaymentCount,
    0,
  );
  const totalTopUpBalance = accounts.reduce(
    (total, account) => total + account.usage.topUpBalance,
    0,
  );
  const overQuotaCount = accounts.filter(
    account =>
      account.usage.monthlyQuota > 0 &&
      account.usage.monthlyUsed >= account.usage.monthlyQuota,
  ).length;

  return (
    <div className="flex min-h-0 flex-auto flex-col">
      <GlobalLoadingProgress query={accountsQuery} />
      <GlobalLoadingProgress query={detailQuery} />
      <StaticPageTitle>
        <Trans message="Billing Admin" />
      </StaticPageTitle>

      <div className="border-b border-divider px-24 py-18">
        <div className="flex flex-wrap items-center justify-between gap-12">
          <div>
            <h1 className="text-xl font-semibold">
              <Trans message="Billing Admin" />
            </h1>
            <div className="mt-4 text-sm text-muted">
              <Trans message="Monitor accounts, NOWPayments payments, usage, and top-ups." />
            </div>
          </div>
          <IconButton
            size="md"
            variant="outline"
            color="primary"
            disabled={accountsQuery.isFetching || detailQuery.isFetching}
            onClick={() => {
              queryClient.invalidateQueries({
                queryKey: adminBillingQueries.accountsKey,
              });
              if (selectedAccount) {
                queryClient.invalidateQueries({
                  queryKey: adminBillingQueries.accountKey(selectedAccount.id),
                });
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </div>
      </div>

      <div className="min-h-0 flex-auto overflow-y-auto p-18 stable-scrollbar md:p-24">
        <div className="grid gap-16 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-16">
            <div className="grid gap-12 md:grid-cols-3">
              <MetricCard
                icon={<CreditScoreIcon />}
                label={<Trans message="Billing accounts" />}
                value={<FormattedNumber value={accounts.length} />}
              />
              <MetricCard
                icon={<PaymentsIcon />}
                label={<Trans message="Pending payments" />}
                value={<FormattedNumber value={allPendingCount} />}
                tone={allPendingCount ? 'warning' : 'positive'}
              />
              <MetricCard
                icon={<AutoAwesomeIcon />}
                label={<Trans message="Top-up balance" />}
                value={<FormattedNumber value={totalTopUpBalance} />}
                caption={
                  overQuotaCount ? (
                    <Trans
                      message=":count account(s) over monthly quota"
                      values={{count: overQuotaCount}}
                    />
                  ) : (
                    <Trans message="Across active accounts" />
                  )
                }
              />
            </div>

            <AdminPanel>
              <PanelHeader
                icon={<CreditScoreIcon />}
                title={<Trans message="Accounts" />}
                description={
                  <Trans message="Plan, quota, and payment state by account" />
                }
              />
              {accountsQuery.isPending ? (
                <AccountTableSkeleton />
              ) : (
                <AccountsTable
                  accounts={accounts}
                  selectedAccountId={selectedAccount?.id ?? null}
                  onSelect={setSelectedAccountId}
                />
              )}
            </AdminPanel>

            <AdminPanel>
              <PanelHeader
                icon={<PaymentsIcon />}
                title={<Trans message="Pending Payments" />}
                description={
                  <Trans message="Submitted hashes, wallet details, and TRON verification" />
                }
              />
              {billing ? (
                <PendingPayments
                  accountId={billing.account.id}
                  payments={pendingPayments}
                />
              ) : (
                <PanelSkeleton rows={3} />
              )}
            </AdminPanel>
          </div>

          <div className="flex min-w-0 flex-col gap-16">
            <SelectedAccountPanel
              account={selectedAccount}
              billing={billing}
              isLoading={detailQuery.isPending}
            />
            <TopUpManagementPanel billing={billing} />
            <UsageLedgerPanel billing={billing} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountsTable({
  accounts,
  selectedAccountId,
  onSelect,
}: {
  accounts: AdminBillingAccount[];
  selectedAccountId: number | null;
  onSelect: (accountId: number) => void;
}) {
  if (!accounts.length) {
    return (
      <div className="mt-16 rounded-panel border border-divider bg-alt/30 px-14 py-18 text-sm text-muted">
        <Trans message="No billing accounts have been created yet." />
      </div>
    );
  }

  return (
    <div className="mt-16 overflow-hidden rounded-panel border border-divider">
      <div className="hidden grid-cols-[minmax(180px,1fr)_120px_170px_120px_120px] gap-12 border-b border-divider bg-alt/40 px-14 py-10 text-xs font-medium uppercase text-muted lg:grid">
        <Trans message="Account" />
        <Trans message="Plan" />
        <Trans message="Usage" />
        <Trans message="Top-ups" />
        <Trans message="Payments" />
      </div>
      <div className="divide-y divide-divider">
        {accounts.map(account => (
          <button
            key={account.id}
            type="button"
            className={clsx(
              'grid w-full gap-12 px-14 py-12 text-left text-sm transition hover:bg-hover lg:grid-cols-[minmax(180px,1fr)_120px_170px_120px_120px] lg:items-center',
              selectedAccountId === account.id && 'bg-primary-light/20',
            )}
            onClick={() => onSelect(account.id)}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-8">
                <span className="font-medium">{account.name}</span>
                <AccountStatusChip status={account.status} />
              </div>
              <div className="mt-3 text-xs text-muted">
                <Trans message="Account" /> #{account.id}
              </div>
            </div>
            <div>
              <div className="font-medium">
                {account.plan?.name ?? <Trans message="No plan" />}
              </div>
              <div className="mt-3 text-xs text-muted">
                {account.subscription?.renewalDate ? (
                  <>
                    <Trans message="Renews" />{' '}
                    {formatDate(account.subscription.renewalDate)}
                  </>
                ) : (
                  <Trans message="No renewal date" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-8 text-xs">
                <span>
                  <FormattedNumber value={account.usage.monthlyUsed} /> /{' '}
                  <FormattedNumber value={account.usage.monthlyQuota} />
                </span>
                <span>{account.usage.usagePercent}%</span>
              </div>
              <ProgressBar
                className="mt-8"
                value={Math.min(
                  account.usage.monthlyUsed,
                  account.usage.monthlyQuota,
                )}
                maxValue={account.usage.monthlyQuota || 1}
                trackHeight="h-6"
                radius="rounded-full"
                trackColor="bg-chip"
                progressColor={usageProgressColor(account.usage.usagePercent)}
                showValueLabel={false}
              />
            </div>
            <div>
              <div className="font-medium">
                <FormattedNumber value={account.usage.topUpBalance} />
              </div>
              <div className="mt-3 text-xs text-muted">
                <Trans message="credits valid" />
              </div>
            </div>
            <div>
              <PaymentCountChip count={account.pendingPaymentCount} />
              {account.latestPendingPayment ? (
                <div className="mt-4 text-xs text-muted">
                  {account.latestPendingPayment.reference}
                </div>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PendingPayments({
  accountId,
  payments,
}: {
  accountId: number;
  payments: PaymentRequest[];
}) {
  if (!payments.length) {
    return (
      <div className="mt-16 rounded-panel border border-divider bg-alt/30 px-14 py-18 text-sm text-muted">
        <Trans message="No pending payments for this account." />
      </div>
    );
  }

  return (
    <div className="mt-16 flex flex-col gap-10">
      {payments.map(payment => (
        <PendingPaymentCard
          key={payment.id}
          accountId={accountId}
          payment={payment}
        />
      ))}
    </div>
  );
}

function PendingPaymentCard({
  accountId,
  payment,
}: {
  accountId: number;
  payment: PaymentRequest;
}) {
  const rejectPayment = useAdminPaymentMutation('reject', accountId);
  const reconcilePayment = useAdminPaymentMutation('reconcile', accountId);

  return (
    <div className="rounded-panel border border-divider bg-alt/20 px-10 py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_128px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-8">
                <div className="text-sm font-semibold">{payment.type}</div>
                <RequestStatusChip status={payment.status} />
                <ProviderStatusChip status={payment.provider?.status ?? null} />
              </div>
              <div className="mt-3 text-[11px] text-muted">
                {payment.reference} · {payment.provider?.name || 'NOWPayments'}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-[11px] text-muted">
                <span>{payment.provider?.status || payment.status}</span>
                {payment.crypto?.expiresAt ? (
                  <span>{formatDateTime(payment.crypto.expiresAt)}</span>
                ) : null}
                {payment.crypto?.scannerUrl ? (
                  <a
                    className="inline-flex items-center gap-4 text-primary hover:underline"
                    href={payment.crypto.scannerUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Trans message="Tronscan" />
                    <OpenInNewIcon size="xs" />
                  </a>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <div className="whitespace-nowrap text-sm font-semibold">
                {formatRupiah(payment.amount)}
              </div>
              <div className="mt-2 text-[11px] text-muted">
                {payment.crypto?.expectedAmount
                  ? `${payment.crypto.expectedAmount} ${payment.crypto.asset}`
                  : '-'}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 lg:flex-col lg:items-stretch">
          <AdminPaymentDetailsTrigger payment={payment} />
          <Button
            size="xs"
            color="primary"
            variant="outline"
            startIcon={<RefreshIcon />}
            disabled={
              rejectPayment.isPending ||
              reconcilePayment.isPending
            }
            onClick={() => reconcilePayment.mutate(payment.id)}
          >
            <Trans message="Refresh" />
          </Button>
          <Button
            size="xs"
            color="danger"
            variant="outline"
            disabled={
              rejectPayment.isPending ||
              reconcilePayment.isPending
            }
            onClick={() => rejectPayment.mutate(payment.id)}
          >
            <Trans message="Reject" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminPaymentDetailsTrigger({payment}: {payment: PaymentRequest}) {
  return (
    <DialogTrigger type="modal">
      <Button size="xs" variant="outline">
        <Trans message="Details" />
      </Button>
      <AdminPaymentDetailsDialog payment={payment} />
    </DialogTrigger>
  );
}

function AdminPaymentDetailsDialog({payment}: {payment: PaymentRequest}) {
  const {close} = useDialogContext();

  return (
    <Dialog size="md">
      <DialogHeader>
        <Trans message="Payment Details" />
      </DialogHeader>
      <DialogBody>
        <div className="grid gap-14 sm:grid-cols-[84px_minmax(0,1fr)]">
          <PaymentQrCode payment={payment} />
          <div className="min-w-0">
            <div className="grid gap-8 text-xs sm:grid-cols-2">
              <InfoPair
                label={<Trans message="Expected" />}
                value={
                  payment.crypto?.expectedAmount
                    ? `${payment.crypto.expectedAmount} ${payment.crypto.asset}`
                    : '-'
                }
              />
              <InfoPair
                label={<Trans message="Provider" />}
                value={payment.provider?.name || 'NOWPayments'}
              />
              <InfoPair
                label={<Trans message="Expires" />}
                value={
                  payment.crypto?.expiresAt
                    ? formatDateTime(payment.crypto.expiresAt)
                    : '-'
                }
              />
              <InfoPair
                label={<Trans message="Status" />}
                value={payment.provider?.status || '-'}
              />
            </div>
            <div className="mt-10 rounded border border-divider bg-alt/20 px-10 py-8">
              <InfoPair
                label={<Trans message="Provider checkout" />}
                value={
                  payment.provider?.checkoutUrl || payment.provider?.invoiceUrl ? (
                    <a
                      className="inline-flex items-center gap-4 break-all text-primary hover:underline"
                      href={
                        payment.provider.checkoutUrl ||
                        payment.provider.invoiceUrl ||
                        undefined
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Trans message="Open checkout" />
                      <OpenInNewIcon size="xs" />
                    </a>
                  ) : (
                    '-'
                  )
                }
              />
            </div>
            <div className="mt-10 rounded border border-divider bg-alt/20 px-10 py-8">
              <InfoPair
                label={<Trans message="Transaction hash" />}
                value={
                  payment.crypto?.scannerUrl ? (
                    <a
                      className="inline-flex items-center gap-4 break-all text-primary hover:underline"
                      href={payment.crypto.scannerUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {payment.crypto.transactionHash || 'Tronscan'}
                      <OpenInNewIcon size="xs" />
                    </a>
                  ) : (
                    payment.crypto?.transactionHash || '-'
                  )
                }
              />
            </div>
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Close" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function PaymentQrCode({payment}: {payment: PaymentRequest}) {
  const qrCodeUrl = payment.provider?.qrCodeUrl;
  if (!qrCodeUrl || !/^https?:\/\//i.test(qrCodeUrl)) {
    return <div className="hidden lg:block" />;
  }

  return (
    <div className="flex items-start">
      <img
        className="size-72 rounded-panel border border-divider bg-white p-3"
        src={qrCodeUrl}
        alt=""
      />
    </div>
  );
}

function SelectedAccountPanel({
  account,
  billing,
  isLoading,
}: {
  account?: AdminBillingAccount;
  billing?: BillingSummary;
  isLoading: boolean;
}) {
  return (
    <AdminPanel>
      <PanelHeader
        icon={<ReceiptLongIcon />}
        title={<Trans message="Account Detail" />}
        description={<Trans message="Current subscription and usage state" />}
      />
      {isLoading || !account || !billing ? (
        <PanelSkeleton rows={5} />
      ) : (
        <div className="mt-16 flex flex-col gap-12">
          <div>
            <div className="text-lg font-semibold">{billing.account.name}</div>
            <div className="mt-3 text-xs text-muted">
              <Trans message="Billing account" /> #{billing.account.id}
            </div>
          </div>
          <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-1">
            <DetailTile
              label={<Trans message="Current plan" />}
              value={`${billing.plan.name} Plan`}
              caption={formatRupiah(billing.plan.price)}
            />
            <DetailTile
              label={<Trans message="Monthly usage" />}
              value={
                <>
                  <FormattedNumber value={billing.usage.monthlyUsed} /> /{' '}
                  <FormattedNumber value={billing.plan.quota} />
                </>
              }
              caption={
                <Trans
                  message="Renews on :date"
                  values={{date: formatDate(billing.subscription.renewalDate)}}
                />
              }
            />
            <DetailTile
              label={<Trans message="Cycle" />}
              value={
                <>
                  {formatDate(billing.subscription.cycleStart)} -{' '}
                  {formatDate(billing.subscription.cycleEnd)}
                </>
              }
              caption={<Trans message="Starts from activation date" />}
            />
          </div>
          <ProgressBar
            value={billing.usage.monthlyUsed}
            maxValue={billing.plan.quota || 1}
            trackHeight="h-10"
            radius="rounded-full"
            trackColor="bg-chip"
            progressColor={usageProgressColor(
              Math.round(
                (billing.usage.monthlyUsed / Math.max(billing.plan.quota, 1)) *
                  100,
              ),
            )}
            showValueLabel={false}
          />
        </div>
      )}
    </AdminPanel>
  );
}

function TopUpManagementPanel({billing}: {billing?: BillingSummary}) {
  return (
    <AdminPanel>
      <PanelHeader
        icon={<AddCardIcon />}
        title={<Trans message="Top-Up Management" />}
        description={<Trans message="Purchased, used, remaining, and expiry" />}
      />
      {billing ? (
        <div className="mt-16 flex flex-col gap-10">
          {billing.topUps.length ? (
            billing.topUps.map(topUp => (
              <TopUpRow key={topUp.id} topUp={topUp} />
            ))
          ) : (
            <div className="rounded-panel border border-divider bg-alt/30 px-14 py-12 text-sm text-muted">
              <Trans message="No top-ups for this account." />
            </div>
          )}
        </div>
      ) : (
        <PanelSkeleton rows={3} />
      )}
    </AdminPanel>
  );
}

function TopUpRow({topUp}: {topUp: TopUpBatch}) {
  const remaining = Math.max(topUp.purchasedCredits - topUp.usedCredits, 0);
  const expireTopUp = useExpireTopUpMutation();
  return (
    <div className="rounded-panel border border-divider bg-alt/30 px-14 py-12">
      <div className="flex flex-wrap items-center justify-between gap-10">
        <div className="font-medium">
          <FormattedNumber value={remaining} /> /{' '}
          <FormattedNumber value={topUp.purchasedCredits} />{' '}
          <Trans message="credits" />
        </div>
        <TopUpStatusChip status={topUp.status} />
      </div>
      <ProgressBar
        className="mt-10"
        value={topUp.usedCredits}
        maxValue={topUp.purchasedCredits || 1}
        trackHeight="h-6"
        radius="rounded-full"
        trackColor="bg-primary-light"
        progressColor="bg-primary"
        showValueLabel={false}
      />
      <div className="mt-8 text-xs text-muted">
        <Trans message="Expires" />:{' '}
        {topUp.expiresAt ? formatDate(topUp.expiresAt) : '-'}
      </div>
      {topUp.status !== 'expired' ? (
        <div className="mt-10">
          <Button
            size="xs"
            variant="outline"
            color="danger"
            disabled={expireTopUp.isPending}
            onClick={() => expireTopUp.mutate(topUp.id)}
          >
            <Trans message="Expire" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function UsageLedgerPanel({billing}: {billing?: BillingSummary}) {
  return (
    <AdminPanel>
      <PanelHeader
        icon={<AutoAwesomeIcon />}
        title={<Trans message="Usage Management" />}
        description={<Trans message="Quota status and recent billing alerts" />}
      />
      {billing ? (
        <div className="mt-16 flex flex-col gap-10">
          <div className="grid gap-10 sm:grid-cols-2">
            <DetailTile
              label={<Trans message="Monthly remaining" />}
              value={<FormattedNumber value={billing.usage.monthlyRemaining} />}
              caption={<Trans message="Included credits left this cycle" />}
            />
            <DetailTile
              label={<Trans message="Top-up remaining" />}
              value={
                <FormattedNumber
                  value={billing.topUps.reduce(
                    (total, topUp) =>
                      topUp.status === 'expired'
                        ? total
                        : total +
                          Math.max(
                            topUp.purchasedCredits - topUp.usedCredits,
                            0,
                          ),
                    0,
                  )}
                />
              }
              caption={<Trans message="Valid extra credits" />}
            />
          </div>
          {billing.alerts.map(alert => (
            <div
              key={alert.title}
              className={clsx(
                'rounded-panel border px-14 py-12 text-sm',
                alertToneClassName(alert.tone),
              )}
            >
              <div className="flex gap-10">
                <AlertIcon tone={alert.tone} />
                <div>
                  <div className="font-medium">{alert.title}</div>
                  <div className="mt-3 text-xs leading-relaxed text-muted">
                    {alert.message}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <PanelSkeleton rows={3} />
      )}
    </AdminPanel>
  );
}

function useAdminPaymentMutation(
  action: 'reject' | 'reconcile',
  accountId: number,
) {
  return useMutation({
    mutationFn: (paymentRequestId: number) =>
      action === 'reject'
          ? rejectAdminBillingPayment(paymentRequestId)
          : reconcileAdminBillingPayment(paymentRequestId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminBillingQueries.accountsKey,
        }),
        queryClient.invalidateQueries({
          queryKey: adminBillingQueries.accountKey(accountId),
        }),
      ]);
      toast(
        action === 'reject'
            ? message('Payment rejected')
            : message('Payment status refreshed'),
      );
    },
  });
}

function useExpireTopUpMutation() {
  return useMutation({
    mutationFn: (topUpId: number) => expireAdminBillingTopUp(topUpId),
    onSuccess: async response => {
      queryClient.setQueryData(
        adminBillingQueries.accountKey(response.billing.account.id),
        {
          billing: response.billing,
        },
      );
      await queryClient.invalidateQueries({
        queryKey: adminBillingQueries.accountsKey,
      });
      toast(message('Top-up expired'));
    },
  });
}

function MetricCard({
  icon,
  label,
  value,
  caption,
  tone = 'primary',
}: {
  icon: ReactNode;
  label: ReactNode;
  value: ReactNode;
  caption?: ReactNode;
  tone?: 'primary' | 'positive' | 'warning';
}) {
  return (
    <div className="dashboard-rounded-panel bg-surface border border-divider p-16">
      <div className="flex items-start gap-12">
        <div
          className={clsx(
            'flex size-36 flex-shrink-0 items-center justify-center rounded-panel',
            tone === 'positive' && 'bg-positive-lighter text-positive',
            tone === 'warning' && 'bg-warning/10 text-warning',
            tone === 'primary' && 'bg-primary/10 text-primary',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase text-muted">
            {label}
          </div>
          <div className="mt-6 text-2xl font-semibold leading-tight">
            {value}
          </div>
          {caption ? (
            <div className="mt-4 text-xs text-muted">{caption}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AdminPanel({children}: {children: ReactNode}) {
  return (
    <section className="dashboard-rounded-panel bg-surface border border-divider p-18 shadow-sm">
      {children}
    </section>
  );
}

function PanelHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
}) {
  return (
    <div className="flex items-start gap-12">
      <div className="flex size-36 flex-shrink-0 items-center justify-center rounded-panel bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-semibold leading-tight">{title}</div>
        <div className="mt-3 text-xs leading-relaxed text-muted">
          {description}
        </div>
      </div>
    </div>
  );
}

function DetailTile({
  label,
  value,
  caption,
}: {
  label: ReactNode;
  value: ReactNode;
  caption: ReactNode;
}) {
  return (
    <div className="rounded-panel border border-divider bg-alt/30 px-14 py-12">
      <div className="text-xs font-medium uppercase text-muted">{label}</div>
      <div className="mt-6 font-semibold">{value}</div>
      <div className="mt-3 text-xs text-muted">{caption}</div>
    </div>
  );
}

function InfoPair({label, value}: {label: ReactNode; value: ReactNode}) {
  return (
    <div className="min-w-0">
      <div className="font-medium uppercase text-muted">{label}</div>
      <div className="mt-3 break-words text-main">{value}</div>
    </div>
  );
}

function PanelSkeleton({rows}: {rows: number}) {
  return (
    <div className="mt-16 flex flex-col gap-10">
      {Array.from({length: rows}).map((_, index) => (
        <Skeleton key={index} className="h-54 w-full" />
      ))}
    </div>
  );
}

function AccountTableSkeleton() {
  return <PanelSkeleton rows={5} />;
}

function AccountStatusChip({status}: {status: AdminBillingAccount['status']}) {
  if (status === 'pending') {
    return (
      <Chip color="chip" size="xs">
        <Trans message="Pending" />
      </Chip>
    );
  }
  if (status === 'rejected') {
    return (
      <Chip color="danger" size="xs">
        <Trans message="Rejected" />
      </Chip>
    );
  }
  return (
    <Chip color="positive" size="xs">
      <Trans message="Good" />
    </Chip>
  );
}

function PaymentCountChip({count}: {count: number}) {
  return count ? (
    <Chip color="chip" size="xs">
      <Trans message=":count pending" values={{count}} />
    </Chip>
  ) : (
    <Chip color="positive" size="xs">
      <Trans message="Clear" />
    </Chip>
  );
}

function RequestStatusChip({status}: {status: RequestStatus}) {
  if (status === 'pending') {
    return (
      <Chip color="chip" size="xs">
        <Trans message="Pending" />
      </Chip>
    );
  }
  if (status === 'rejected') {
    return (
      <Chip color="danger" size="xs">
        <Trans message="Rejected" />
      </Chip>
    );
  }
  if (status === 'cancelled') {
    return (
      <Chip color="chip" size="xs">
        <Trans message="Cancelled" />
      </Chip>
    );
  }
  return (
    <Chip color="positive" size="xs">
      <Trans message="Paid" />
    </Chip>
  );
}

function ProviderStatusChip({status}: {status: string | null}) {
  if (!status) {
    return (
      <Chip color="chip" size="xs">
        <Trans message="No provider status" />
      </Chip>
    );
  }

  const normalized = status.toUpperCase();
  const paid =
    normalized.includes('PAY_SUCCESS') ||
    normalized.includes('PAID') ||
    normalized.includes('TRADE_SUCCESS');
  const failed =
    normalized.includes('FAIL') ||
    normalized.includes('EXPIRED') ||
    normalized.includes('CANCEL');

  return (
    <Chip color={paid ? 'positive' : failed ? 'danger' : 'chip'} size="xs">
      {status}
    </Chip>
  );
}

function TopUpStatusChip({status}: {status: TopUpBatch['status']}) {
  if (status === 'expired') {
    return (
      <Chip color="chip" size="xs">
        <Trans message="Expired" />
      </Chip>
    );
  }
  if (status === 'in_use') {
    return (
      <Chip color="primary" size="xs">
        <Trans message="In Use" />
      </Chip>
    );
  }
  return (
    <Chip color="positive" size="xs">
      <Trans message="Active" />
    </Chip>
  );
}

function AlertIcon({
  tone,
}: {
  tone: 'info' | 'success' | 'warning' | 'critical';
}) {
  const className = clsx('mt-1 flex-shrink-0', {
    'text-primary': tone === 'info',
    'text-positive': tone === 'success',
    'text-warning': tone === 'warning',
    'text-danger': tone === 'critical',
  });
  if (tone === 'success') {
    return <CheckCircleIcon className={className} size="sm" />;
  }
  if (tone === 'critical') {
    return <ErrorOutlineIcon className={className} size="sm" />;
  }
  if (tone === 'warning') {
    return <WarningAmberIcon className={className} size="sm" />;
  }
  return <InfoIcon className={className} size="sm" />;
}

function alertToneClassName(
  tone: 'info' | 'success' | 'warning' | 'critical',
): string {
  switch (tone) {
    case 'critical':
      return 'border-danger/40 bg-danger-lighter';
    case 'warning':
      return 'border-warning/40 bg-warning/10';
    case 'success':
      return 'border-positive/40 bg-positive-lighter';
    default:
      return 'border-primary/30 bg-primary-light/20';
  }
}

function usageProgressColor(percent: number): string {
  if (percent >= 100) return 'bg-danger';
  if (percent >= 80) return 'bg-warning';
  return 'bg-positive';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
}
