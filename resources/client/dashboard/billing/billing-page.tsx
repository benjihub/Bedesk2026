import {
  BillingAlert,
  BillingStatus,
  BillingSummary,
  AlertTone,
  BillingNotification,
  PaymentRequest,
  RequestStatus,
  TopUpBatch,
  billingQueries,
  cancelBillingPaymentRequest,
  requestPlan,
  requestTopUp,
} from '@app/dashboard/billing/requests/billing-queries';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {queryClient} from '@common/http/query-client';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {AddCardIcon} from '@ui/icons/material/AddCard';
import {AutoAwesomeIcon} from '@ui/icons/material/AutoAwesome';
import {CalendarTodayIcon} from '@ui/icons/material/CalendarToday';
import {CheckCircleIcon} from '@ui/icons/material/CheckCircle';
import {CreditScoreIcon} from '@ui/icons/material/CreditScore';
import {ErrorOutlineIcon} from '@ui/icons/material/ErrorOutline';
import {InfoIcon} from '@ui/icons/material/Info';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {PaymentsIcon} from '@ui/icons/material/Payments';
import {ReceiptLongIcon} from '@ui/icons/material/ReceiptLong';
import {NotificationsActiveIcon} from '@ui/icons/material/NotificationsActive';
import {UpgradeIcon} from '@ui/icons/material/Upgrade';
import {WarningAmberIcon} from '@ui/icons/material/WarningAmber';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {ProgressBar} from '@ui/progress/progress-bar';
import {toast} from '@ui/toast/toast';
import clsx from 'clsx';
import {Fragment, ReactNode} from 'react';
import {Link} from 'react-router';

export function Component() {
  const query = useQuery(billingQueries.summary());
  const billingSummary = query.data?.billing;

  if (query.isPending) {
    return (
      <div className="flex h-full flex-col">
        <StaticPageTitle>
          <Trans message="Billing & Usage" />
        </StaticPageTitle>
        <DatatablePageHeaderBar showSidebarToggleButton>
          <Trans message="Billing & Usage" />
        </DatatablePageHeaderBar>
        <div className="flex-auto overflow-y-auto p-12 stable-scrollbar md:p-24">
          <div className="mx-auto flex max-w-6xl flex-col gap-16">
            <BillingSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!billingSummary) {
    return (
      <div className="flex h-full flex-col">
        <StaticPageTitle>
          <Trans message="Billing & Usage" />
        </StaticPageTitle>
        <DatatablePageHeaderBar showSidebarToggleButton>
          <Trans message="Billing & Usage" />
        </DatatablePageHeaderBar>
        <div className="p-24">
          <BillingCard>
            <Trans message="Billing data could not be loaded." />
          </BillingCard>
        </div>
      </div>
    );
  }

  const monthlyRemaining = Math.max(
    billingSummary.plan.quota - billingSummary.usage.monthlyUsed,
    0,
  );
  const monthlyUsagePercent =
    billingSummary.usage.monthlyUsed / billingSummary.plan.quota;
  const topUpCredits = billingSummary.topUps.reduce(
    (total, batch) =>
      batch.status === 'expired'
        ? total
        : total + batch.purchasedCredits - batch.usedCredits,
    0,
  );
  const monthlyQuotaExhausted =
    billingSummary.usage.monthlyUsed >= billingSummary.plan.quota;
  const isTopUpInUse = monthlyQuotaExhausted && topUpCredits > 0;

  return (
    <div className="flex h-full flex-col">
      <StaticPageTitle>
        <Trans message="Billing & Usage" />
      </StaticPageTitle>

      <DatatablePageHeaderBar showSidebarToggleButton>
        <div className="flex min-w-0 flex-auto items-center justify-between gap-12">
          <div className="min-w-0">
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
              <Trans message="Billing & Usage" />
            </div>
            <div className="mt-2 text-xs font-normal text-muted">
              {billingSummary.account.name}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-8 max-sm:hidden">
            <RequestUpgradeTrigger billingSummary={billingSummary} />
            <RequestTopUpTrigger billingSummary={billingSummary} />
          </div>
        </div>
      </DatatablePageHeaderBar>

      <div className="flex-auto overflow-y-auto p-12 stable-scrollbar md:p-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-16">
          <div className="flex gap-8 sm:hidden">
            <RequestUpgradeTrigger billingSummary={billingSummary} compact />
            <RequestTopUpTrigger billingSummary={billingSummary} compact />
          </div>

          <AlertStack alerts={billingSummary.alerts} />

          <div className="grid grid-cols-1 items-start gap-16 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
            <div className="flex min-w-0 flex-col gap-16">
              <CurrentPlanCard billingSummary={billingSummary} />
              <UsageCard
                billingSummary={billingSummary}
                monthlyRemaining={monthlyRemaining}
                monthlyUsagePercent={monthlyUsagePercent}
                topUpCredits={topUpCredits}
                isTopUpInUse={isTopUpInUse}
              />
              <PaymentHistoryCard billingSummary={billingSummary} />
            </div>
            <div className="flex min-w-0 flex-col gap-16">
              <PaymentStatusCard billingSummary={billingSummary} />
              <BillingActivityCard billingSummary={billingSummary} />
              <PlanComparisonCard billingSummary={billingSummary} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestUpgradeTrigger({
  billingSummary,
  compact,
}: {
  billingSummary: BillingSummary;
  compact?: boolean;
}) {
  return (
    <DialogTrigger type="modal">
      <Button
        className={compact ? 'flex-1' : undefined}
        variant="outline"
        color="primary"
        startIcon={<UpgradeIcon />}
      >
        {compact ? (
          <Trans message="Upgrade" />
        ) : (
          <Trans message="Request Upgrade" />
        )}
      </Button>
      <RequestUpgradeDialog billingSummary={billingSummary} />
    </DialogTrigger>
  );
}

function RequestTopUpTrigger({
  billingSummary,
  compact,
}: {
  billingSummary: BillingSummary;
  compact?: boolean;
}) {
  return (
    <DialogTrigger type="modal">
      <Button
        className={compact ? 'flex-1' : undefined}
        variant="flat"
        color="primary"
        startIcon={<AddCardIcon />}
      >
        {compact ? (
          <Trans message="Top-Up" />
        ) : (
          <Trans message="Request Top-Up" />
        )}
      </Button>
      <RequestTopUpDialog billingSummary={billingSummary} />
    </DialogTrigger>
  );
}

function RequestUpgradeDialog({
  billingSummary,
}: {
  billingSummary: BillingSummary;
}) {
  const {close} = useDialogContext();
  const mutation = useMutation({
    mutationFn: (planId: number) => requestPlan(planId),
    onSuccess: async response => {
      queryClient.setQueryData(billingQueries.summaryKey, {
        billing: response.billing,
      });
      await queryClient.invalidateQueries({
        queryKey: billingQueries.summaryKey,
      });
      toast.positive(successToastMessage(response.paymentRequest));
      close();
    },
    onError: error => {
      toast.danger(billingRequestErrorMessage(error));
    },
  });

  const upgradePlans = billingSummary.plans.filter(
    plan => plan.id !== billingSummary.plan.id,
  );

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Request Plan Upgrade" />
      </DialogHeader>
      <DialogBody>
        <div className="text-sm text-muted">
          <Trans message="Choose a plan. A crypto payment request will be created and activated after verification." />
        </div>
        <div className="mt-16 flex flex-col gap-10">
          {upgradePlans.map(plan => (
            <button
              key={plan.id}
              type="button"
              className="rounded-panel border border-divider p-14 text-left transition hover:border-primary hover:bg-primary-light/20"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(plan.id)}
            >
              <div className="flex items-start justify-between gap-12">
                <div>
                  <div className="font-medium">
                    {plan.name} <Trans message="Plan" />
                  </div>
                  <div className="mt-4 text-xs text-muted">
                    <FormattedNumber value={plan.quota} />{' '}
                    <Trans message="AI replies/month" />
                  </div>
                </div>
                <div className="whitespace-nowrap text-sm font-semibold">
                  {formatRupiah(plan.price)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogBody>
      <DialogFooter>
        {mutation.isPending ? (
          <div className="mr-auto text-sm text-muted">
            <Trans message="Creating payment request..." />
          </div>
        ) : mutation.isError ? (
          <div className="mr-auto text-sm text-danger">
            {billingRequestErrorMessage(mutation.error)}
          </div>
        ) : null}
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function RequestTopUpDialog({
  billingSummary,
}: {
  billingSummary: BillingSummary;
}) {
  const {close} = useDialogContext();
  const mutation = useMutation({
    mutationFn: () => requestTopUp(),
    onSuccess: async response => {
      queryClient.setQueryData(billingQueries.summaryKey, {
        billing: response.billing,
      });
      await queryClient.invalidateQueries({
        queryKey: billingQueries.summaryKey,
      });
      toast.positive(successToastMessage(response.paymentRequest));
      close();
    },
    onError: error => {
      toast.danger(billingRequestErrorMessage(error));
    },
  });

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Request Top-Up" />
      </DialogHeader>
      <DialogBody>
        <div className="rounded-panel border border-primary bg-primary-light/20 p-14">
          <div className="flex items-start justify-between gap-12">
            <div>
              <div className="font-medium">
                <FormattedNumber value={billingSummary.topUpPackage.credits} />{' '}
                <Trans message="AI Reply Credits" />
              </div>
              <div className="mt-4 text-xs text-muted">
                <Trans message="Used only after monthly quota is exhausted." />
              </div>
              <div className="mt-4 text-xs text-muted">
                <Trans message="Expires" />{' '}
                {billingSummary.topUpPackage.expiryHours}{' '}
                <Trans message="hours after activation." />
              </div>
            </div>
            <div className="whitespace-nowrap text-sm font-semibold">
              {formatRupiah(billingSummary.topUpPackage.price)}
            </div>
          </div>
        </div>
        <div className="mt-14 text-sm text-muted">
          <Trans message="A crypto payment request will be created. Credits are added after the payment is verified." />
        </div>
      </DialogBody>
      <DialogFooter>
        {mutation.isPending ? (
          <div className="mr-auto text-sm text-muted">
            <Trans message="Creating payment request..." />
          </div>
        ) : mutation.isError ? (
          <div className="mr-auto text-sm text-danger">
            {billingRequestErrorMessage(mutation.error)}
          </div>
        ) : null}
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? (
            <Trans message="Creating..." />
          ) : (
            <Trans message="Create Request" />
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function CurrentPlanCard({billingSummary}: {billingSummary: BillingSummary}) {
  return (
    <BillingCard className="p-12 md:p-14">
      <CardHeader
        icon={<CreditScoreIcon />}
        title={<Trans message="Current Plan" />}
        description={<Trans message="One active plan for this account" />}
        action={
          <Chip color="positive" size="sm">
            <Trans message="Good Standing" />
          </Chip>
        }
      />
      <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_190px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-8">
            <div className="text-lg font-semibold leading-tight">
              {billingSummary.plan.name} <Trans message="Plan" />
            </div>
            <Chip color="primary" size="xs">
              <Trans message="Current" />
            </Chip>
          </div>
          <div className="mt-6 grid gap-4 text-xs text-muted">
            <div className="flex items-center gap-6">
              <CalendarTodayIcon size="xs" />
              <span>
                <Trans message="Billing cycle" />:{' '}
                {formatDate(billingSummary.subscription.cycleStart)} -{' '}
                {formatDate(billingSummary.subscription.cycleEnd)}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <CalendarTodayIcon size="xs" />
              <span>
                <Trans message="Renews on" />{' '}
                {formatDate(billingSummary.subscription.renewalDate)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex min-h-[72px] flex-col justify-center rounded-panel border border-divider bg-alt/50 px-10 py-8 md:text-right">
          <div className="text-[11px] font-medium uppercase text-muted">
            <Trans message="Monthly price" />
          </div>
          <div className="mt-3 whitespace-nowrap text-base font-semibold">
            {formatRupiah(billingSummary.plan.price)}
          </div>
          <div className="mt-2 text-[11px] text-muted">
            <Trans message="Crypto payment confirmation" />
          </div>
        </div>
      </div>
    </BillingCard>
  );
}

interface UsageCardProps {
  billingSummary: BillingSummary;
  monthlyRemaining: number;
  monthlyUsagePercent: number;
  topUpCredits: number;
  isTopUpInUse: boolean;
}
function UsageCard({
  billingSummary,
  monthlyRemaining,
  monthlyUsagePercent,
  topUpCredits,
  isTopUpInUse,
}: UsageCardProps) {
  const progressColor = usageProgressColor(monthlyUsagePercent);
  return (
    <BillingCard className="p-12 md:p-14">
      <CardHeader
        icon={<AutoAwesomeIcon />}
        title={<Trans message="AI Reply Usage" />}
        description={
          <Trans message="One successful AI Agent message consumes one AI Reply Credit" />
        }
        action={
          isTopUpInUse ? (
            <Chip color="primary" size="sm">
              <Trans message="Top-Up In Use" />
            </Chip>
          ) : undefined
        }
      />

      <div className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="min-w-0">
            <div className="text-lg font-semibold leading-tight md:text-xl">
              <FormattedNumber value={billingSummary.usage.monthlyUsed} />{' '}
              <span className="text-xs font-normal text-muted">
                / <FormattedNumber value={billingSummary.plan.quota} />{' '}
                <Trans message="used" />
              </span>
            </div>
          </div>
          <div className="px-7 rounded-full bg-alt py-2 text-[11px] font-medium text-muted">
            <FormattedNumber value={Math.round(monthlyUsagePercent * 100)} />{' '}
            <Trans message="% used" />
          </div>
        </div>
        <ProgressBar
          className="mt-9"
          value={billingSummary.usage.monthlyUsed}
          maxValue={billingSummary.plan.quota}
          trackHeight="h-8"
          radius="rounded-full"
          trackColor="bg-chip"
          progressColor={progressColor}
          showValueLabel={false}
        />
        <div className="mt-8 grid gap-4 text-xs md:grid-cols-[minmax(0,1fr)_minmax(220px,auto)] md:items-center">
          <span className="font-medium">
            <FormattedNumber value={monthlyRemaining} />{' '}
            <Trans message="monthly credits remaining" />
          </span>
          <span className="text-muted md:text-right">
            <Trans message="Usage resets on your renewal date. Unused credits do not roll over." />
          </span>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <UsageMetric
          label={<Trans message="Plan quota" />}
          value={<FormattedNumber value={billingSummary.plan.quota} />}
          icon={<AutoAwesomeIcon />}
        />
        <UsageMetric
          label={<Trans message="Top-up balance" />}
          value={<FormattedNumber value={topUpCredits} />}
          icon={<AddCardIcon />}
        />
        <UsageMetric
          label={<Trans message="Total available now" />}
          value={<FormattedNumber value={monthlyRemaining + topUpCredits} />}
          icon={<CheckCircleIcon />}
        />
      </div>

      <TopUpDetails
        billingSummary={billingSummary}
        isTopUpInUse={isTopUpInUse}
      />
    </BillingCard>
  );
}

function TopUpDetails({
  billingSummary,
  isTopUpInUse,
}: {
  billingSummary: BillingSummary;
  isTopUpInUse: boolean;
}) {
  if (!billingSummary.topUps.length) {
    return (
      <div className="mt-10 border-t border-divider pt-8 text-xs text-muted">
        <Trans message="No active top-up. Running low? You can top up anytime." />
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-divider pt-8">
      <div className="flex flex-wrap items-center justify-between gap-8">
        <div>
          <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
            <Trans message="Top-Up Credits" />
            <Chip color={isTopUpInUse ? 'primary' : 'chip'} size="xs">
              {isTopUpInUse ? (
                <Trans message="In use" />
              ) : (
                <Trans message="Not yet in use" />
              )}
            </Chip>
          </div>
          <div className="mt-1 max-w-[520px] text-[11px] text-muted">
            <Trans message="Top-up credits are used only after monthly quota runs out." />
          </div>
        </div>
        <Chip color="chip" size="xs">
          <Trans message="Oldest expiry used first" />
        </Chip>
      </div>
      <div className="mt-6 flex flex-col gap-5">
        {billingSummary.topUps.map(batch => {
          const remaining = batch.purchasedCredits - batch.usedCredits;
          return (
            <div
              key={batch.id}
              className="grid gap-6 rounded-panel border border-divider bg-alt/30 px-8 py-6 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center"
            >
              <div>
                <div className="flex flex-wrap items-center gap-6 text-xs">
                  <span className="font-medium">
                    <FormattedNumber value={remaining} /> /{' '}
                    <FormattedNumber value={batch.purchasedCredits} />{' '}
                    <Trans message="credits available" />
                  </span>
                  <TopUpStatusChip status={batch.status} />
                </div>
                <ProgressBar
                  className="mt-5"
                  value={batch.usedCredits}
                  maxValue={batch.purchasedCredits}
                  trackHeight="h-6"
                  radius="rounded-full"
                  trackColor="bg-primary-light"
                  progressColor="bg-primary"
                  showValueLabel={false}
                />
              </div>
              <div className="text-[11px] text-muted sm:text-right">
                <Trans message="Expires" />
                <div className="mt-1 font-medium text-main">
                  {batch.expiresAt ? (
                    formatDate(batch.expiresAt)
                  ) : (
                    <Trans message="No expiry" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaymentStatusCard({billingSummary}: {billingSummary: BillingSummary}) {
  return (
    <BillingCard>
      <CardHeader
        icon={<PaymentsIcon />}
        title={<Trans message="Payments" />}
        description={<Trans message="NOWPayments checkout" />}
        action={<PaymentStatusChip status={billingSummary.account.status} />}
      />

      {billingSummary.pendingRequests.length ? (
        <Fragment>
          <div className="mt-14 flex items-center justify-between gap-12 text-sm font-medium">
            <Trans message="Pending" />
            <span className="text-xs font-normal text-muted">
              <FormattedNumber value={billingSummary.pendingRequests.length} />
            </span>
          </div>
          <div className="mt-8 flex flex-col gap-8">
            {billingSummary.pendingRequests.map(request => (
              <PaymentRequestRow key={request.id} request={request} compact />
            ))}
          </div>
        </Fragment>
      ) : null}
    </BillingCard>
  );
}

function BillingActivityCard({
  billingSummary,
}: {
  billingSummary: BillingSummary;
}) {
  return (
    <BillingCard>
      <CardHeader
        icon={<NotificationsActiveIcon />}
        title={<Trans message="Billing Activity" />}
        description={<Trans message="Recent billing notifications" />}
      />
      {billingSummary.notifications?.length ? (
        <div className="mt-12 flex flex-col gap-6">
          {billingSummary.notifications.map(notification => (
            <BillingNotificationRow
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-panel border border-divider bg-alt/30 px-10 py-8 text-xs text-muted">
          <Trans message="No billing notifications yet." />
        </div>
      )}
    </BillingCard>
  );
}

function BillingNotificationRow({
  notification,
}: {
  notification: BillingNotification;
}) {
  return (
    <div className="grid gap-7 rounded-panel border border-divider bg-alt/30 px-10 py-8 sm:grid-cols-[22px_minmax(0,1fr)_76px] sm:items-start">
      <span
        className={clsx(
          'flex size-22 flex-shrink-0 items-center justify-center rounded-full',
          alertIconBgClassName(notification.tone),
        )}
      >
        <AlertIcon tone={notification.tone} />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium leading-snug">
          {notification.title}
        </div>
        <div className="mt-2 text-[11px] leading-snug text-muted">
          {notification.message}
        </div>
      </div>
      <div className="text-[11px] text-muted sm:text-right">
        {notification.notifiedAt ? formatDate(notification.notifiedAt) : null}
      </div>
    </div>
  );
}

function PaymentHistoryCard({
  billingSummary,
}: {
  billingSummary: BillingSummary;
}) {
  return (
    <BillingCard>
      <CardHeader
        icon={<ReceiptLongIcon />}
        title={<Trans message="Payment History" />}
        description={<Trans message="Five most recent payments" />}
        action={
          <Button
            size="xs"
            variant="outline"
            elementType={Link}
            to="/dashboard/billing/history"
          >
            <Trans message="View All" />
          </Button>
        }
      />
      <div className="mt-18 overflow-hidden">
        <div className="hidden grid-cols-[130px_minmax(0,1fr)_150px_100px] gap-12 border-b border-divider px-10 pb-10 text-xs font-medium uppercase text-muted md:grid">
          <Trans message="Date" />
          <Trans message="Type" />
          <div className="text-right">
            <Trans message="Amount" />
          </div>
          <div className="text-right">
            <Trans message="Status" />
          </div>
        </div>
        <div className="divide-y divide-divider">
          {billingSummary.paymentHistory.map(request => (
            <PaymentRequestRow key={request.id} request={request} />
          ))}
        </div>
      </div>
    </BillingCard>
  );
}

function PlanComparisonCard({
  billingSummary,
}: {
  billingSummary: BillingSummary;
}) {
  return (
    <BillingCard>
      <CardHeader
        icon={<UpgradeIcon />}
        title={<Trans message="Compare Plans" />}
        description={<Trans message="Monthly AI Reply Credit packages" />}
      />
      <div className="mt-18 flex flex-col gap-10">
        {billingSummary.plans.map(plan => (
          <div
            key={plan.id}
            className={clsx(
              'rounded-panel border px-14 py-12',
              plan.id === billingSummary.plan.id
                ? 'border-primary bg-primary-light/30'
                : 'border-divider',
            )}
          >
            <div className="grid gap-10 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-8 font-medium">
                  {plan.name} <Trans message="Plan" />
                  {plan.id === billingSummary.plan.id ? (
                    <Chip color="primary" size="xs">
                      <Trans message="Current" />
                    </Chip>
                  ) : null}
                </div>
                <div className="mt-4 text-xs text-muted">
                  <FormattedNumber value={plan.quota} />{' '}
                  <Trans message="AI replies/month" />
                </div>
              </div>
              <div className="whitespace-nowrap text-sm font-semibold sm:text-right">
                {formatRupiah(plan.price)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </BillingCard>
  );
}

interface PaymentRequestRowProps {
  request: PaymentRequest;
  compact?: boolean;
}

function CryptoInstructionSummary({request}: {request: PaymentRequest}) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-[11px] text-muted">
      {request.crypto.expiresAt ? (
        <span>
          <Trans message="Due" /> {formatDateTime(request.crypto.expiresAt)}
        </span>
      ) : null}
      <span>
        <Trans message="Provider" /> {request.provider.name || 'NOWPayments'}
      </span>
      <TransactionScannerLink request={request} />
    </div>
  );
}

function PaymentRequestRow({request, compact}: PaymentRequestRowProps) {
  if (compact) {
    return (
      <div className="rounded-panel border border-divider bg-alt/20 px-10 py-8">
        <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_104px] sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-8">
              <div className="text-sm font-semibold">{request.type}</div>
              <RequestStatusChip status={request.status} />
            </div>
            {request.status === 'pending' ? (
              <CryptoInstructionSummary request={request} />
            ) : (
              <div className="mt-3 text-xs text-muted">
                {formatDate(request.requestedAt)}
              </div>
            )}
          </div>
          <div className="sm:text-right">
            <div className="whitespace-nowrap text-sm font-semibold">
              {formatRupiah(request.amount)}
            </div>
            {request.status === 'pending' ? (
              <div className="mt-6 flex sm:justify-end">
                <PaymentDetailsTrigger request={request} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 px-10 py-14 text-sm md:grid-cols-[130px_minmax(0,1fr)_150px_100px] md:items-start md:gap-12">
      <div className="text-muted">{formatDate(request.requestedAt)}</div>
      <div>
        <div className="font-medium">{request.type}</div>
        <div className="mt-2 text-xs text-muted">
          {request.notes || request.reference}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-10 gap-y-2 text-xs text-muted">
          <span>
            <Trans message="Provider" /> {request.provider.name || 'NOWPayments'}
          </span>
          <TransactionScannerLink request={request} />
        </div>
      </div>
      <div className="whitespace-nowrap font-medium md:text-right">
        {formatRupiah(request.amount)}
      </div>
      <div className="flex flex-col items-start md:items-end">
        <RequestStatusChip status={request.status} />
      </div>
    </div>
  );
}

function PaymentDetailsTrigger({request}: {request: PaymentRequest}) {
  return (
    <DialogTrigger type="modal">
      <Button size="xs" variant="outline" color="primary">
        <Trans message="Details" />
      </Button>
      <PaymentDetailsDialog request={request} />
    </DialogTrigger>
  );
}

function useCancelPaymentRequest() {
  return useMutation({
    mutationFn: (paymentRequestId: number) =>
      cancelBillingPaymentRequest(paymentRequestId),
    onSuccess: async response => {
      queryClient.setQueryData(billingQueries.summaryKey, {
        billing: response.billing,
      });
      await queryClient.invalidateQueries({
        queryKey: billingQueries.summaryKey,
      });
      toast(message('Payment request cancelled'));
    },
    onError: error => {
      toast.danger(billingRequestErrorMessage(error));
    },
  });
}

function PaymentDetailsDialog({request}: {request: PaymentRequest}) {
  const {close} = useDialogContext();
  const cancelRequest = useCancelPaymentRequest();

  return (
    <Dialog size="lg">
      <DialogHeader>
        <Trans message="Payment Details" />
      </DialogHeader>
      <DialogBody>
        <NowPaymentsPaymentBox request={request} />
      </DialogBody>
      <DialogFooter>
        <Button
          className="mr-auto"
          variant="outline"
          color="danger"
          disabled={cancelRequest.isPending}
          onClick={() => {
            cancelRequest.mutate(request.id, {
              onSuccess: () => close(),
            });
          }}
        >
          {cancelRequest.isPending ? (
            <Trans message="Cancelling..." />
          ) : request.type === 'Top-Up' ? (
            <Trans message="Cancel Top-Up" />
          ) : (
            <Trans message="Cancel Request" />
          )}
        </Button>
        <Button onClick={() => close()}>
          <Trans message="Close" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function NowPaymentsPaymentBox({request}: {request: PaymentRequest}) {
  const checkoutUrl =
    request.provider.checkoutUrl || request.provider.invoiceUrl;
  const providerId = request.provider.paymentId || request.provider.prepayId;

  return (
    <div className="rounded-panel border border-divider bg-surface">
      <div className="border-b border-divider px-14 py-12">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-8">
              <div className="text-sm font-semibold">{request.type}</div>
              <RequestStatusChip status={request.status} />
            </div>
            <div className="mt-3 break-all font-mono text-[11px] text-muted">
              {request.reference}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[11px] font-medium uppercase text-muted">
              <Trans message="Amount" />
            </div>
            <div className="mt-1 text-base font-semibold leading-tight">
              {formatRupiah(request.amount)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-14 p-14 md:grid-cols-[160px_minmax(0,1fr)]">
        <PaymentCheckoutPanel request={request} checkoutUrl={checkoutUrl} />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-8">
            <Chip color="chip" size="xs">
              {request.provider.name || 'NOWPayments'}
            </Chip>
            {request.provider.status ? (
              <span className="text-xs text-muted">
                {request.provider.status}
              </span>
            ) : null}
          </div>

          <div className="mt-10 divide-y divide-divider rounded border border-divider">
            <PaymentDetailRow
              label={<Trans message="Currency" />}
              value={request.currency}
            />
            <PaymentDetailRow
              label={<Trans message="Expires" />}
              value={
                request.crypto.expiresAt
                  ? formatDateTime(request.crypto.expiresAt)
                  : '-'
              }
            />
            {providerId ? (
              <PaymentDetailRow
                label={<Trans message="Provider ID" />}
                value={providerId}
                mono
              />
            ) : null}
            {request.crypto.walletAddress ? (
              <PaymentDetailRow
                label={<Trans message="Wallet" />}
                value={request.crypto.walletAddress}
                mono
              />
            ) : null}
          </div>

          <div className="mt-10 rounded bg-alt/30 px-10 py-8 text-xs leading-relaxed text-muted">
            <Trans message="Payment activates automatically after NOWPayments confirms it." />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentCheckoutPanel({
  request,
  checkoutUrl,
}: {
  request: PaymentRequest;
  checkoutUrl: string | null;
}) {
  return (
    <div className="flex flex-col items-start gap-10">
      <div className="flex min-h-120 w-full items-center justify-center rounded-panel border border-divider bg-alt/20 p-10">
        <PaymentQrCode request={request} />
      </div>
      <div className="w-full">
        {checkoutUrl ? (
          <Button
            className="w-full"
            elementType="a"
            href={checkoutUrl}
            target="_blank"
            rel="noreferrer"
            size="sm"
            color="primary"
            variant="flat"
            endIcon={<OpenInNewIcon size="xs" />}
          >
            <Trans message="Pay Now" />
          </Button>
        ) : (
          <Chip color="chip" size="sm">
            <Trans message="Checkout link pending" />
          </Chip>
        )}
      </div>
    </div>
  );
}

function PaymentDetailRow({
  label,
  value,
  mono,
}: {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-3 px-10 py-7 text-xs sm:grid-cols-[96px_minmax(0,1fr)]">
      <div className="font-medium text-muted">{label}</div>
      <div
        className={clsx(
          'min-w-0 break-words text-main',
          mono && 'break-all font-mono text-[11px] leading-relaxed',
        )}
      >
        {value}
      </div>
    </div>
  );
}

function PaymentQrCode({request}: {request: PaymentRequest}) {
  const qrCodeUrl = request.provider?.qrCodeUrl;
  if (!qrCodeUrl || !isImageUrl(qrCodeUrl)) {
    return (
      <div className="flex flex-col items-center gap-6 text-center text-muted">
        <span className="flex size-46 items-center justify-center rounded-full bg-chip">
          <PaymentsIcon size="md" />
        </span>
        <div className="text-[11px] leading-snug">
          <Trans message="Open checkout to complete payment." />
        </div>
      </div>
    );
  }

  return (
    <img
      className="size-[104px] rounded-panel border border-divider bg-white p-3"
      src={qrCodeUrl}
      alt=""
    />
  );
}

function TransactionScannerLink({request}: {request: PaymentRequest}) {
  if (!request.crypto.scannerUrl) {
    return null;
  }

  return (
    <a
      className="inline-flex items-center gap-4 text-primary hover:underline"
      href={request.crypto.scannerUrl}
      target="_blank"
      rel="noreferrer"
    >
      <Trans message="Tronscan" />
      <OpenInNewIcon size="xs" />
    </a>
  );
}

function isImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function successToastMessage(request: PaymentRequest): string {
  return request.provider.checkoutUrl || request.provider.invoiceUrl
    ? 'Payment request created. Open NOWPayments checkout to pay.'
    : 'Payment request created.';
}

function billingRequestErrorMessage(error: unknown): string {
  const fallback = 'Could not create payment request.';

  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  const response = (
    error as {
      response?: {
        data?: {
          message?: string;
          errors?: Record<string, string[]>;
        };
      };
    }
  ).response;

  if (response?.data?.message) {
    return response.data.message;
  }

  const firstValidationError = Object.values(
    response?.data?.errors || {},
  )[0]?.[0];
  if (firstValidationError) {
    return firstValidationError;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

interface UsageMetricProps {
  label: ReactNode;
  value: ReactNode;
  icon: ReactNode;
}
function UsageMetric({label, value, icon}: UsageMetricProps) {
  return (
    <div className="flex min-h-[68px] flex-col justify-between rounded-panel border border-divider bg-alt/30 px-8 py-6">
      <div className="flex min-h-20 items-start gap-5 text-[10px] font-medium uppercase text-muted">
        <span className="text-primary">{icon}</span>
        <span className="leading-snug">{label}</span>
      </div>
      <div className="mt-5 text-base font-semibold leading-tight">{value}</div>
    </div>
  );
}

interface AlertStackProps {
  alerts: BillingAlert[];
}
function AlertStack({alerts}: AlertStackProps) {
  if (!alerts.length) return null;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {alerts.slice(0, 2).map(alert => (
        <div
          key={alert.title}
          className={clsx(
            'rounded-panel border px-8 py-6 text-xs',
            alertToneClassName(alert.tone),
          )}
        >
          <div className="flex min-w-0 items-center gap-6">
            <span
              className={clsx(
                'flex size-20 flex-shrink-0 items-center justify-center rounded-full',
                alertIconBgClassName(alert.tone),
              )}
            >
              <AlertIcon tone={alert.tone} />
            </span>
            <div className="flex min-w-0 items-center gap-6">
              <span className="flex-shrink-0 font-medium leading-tight">
                {compactAlertTitle(alert)}
              </span>
              <span className="min-w-0 truncate text-muted">
                {compactAlertMessage(alert)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function compactAlertTitle(alert: BillingAlert): ReactNode {
  if (alert.tone === 'critical') {
    return <Trans message="Quota reached" />;
  }
  if (alert.tone === 'warning') {
    return <Trans message="Usage high" />;
  }
  return alert.title;
}

function compactAlertMessage(alert: BillingAlert): ReactNode {
  if (alert.tone === 'critical') {
    return <Trans message="Add credits to keep AI replies active." />;
  }
  if (alert.tone === 'warning') {
    return <Trans message="Top up before credits run out." />;
  }
  if (alert.title === 'Crypto payment confirmation is enabled') {
    return <Trans message="Crypto payments are verified before activation." />;
  }
  return alert.message;
}

interface CardHeaderProps {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}
function CardHeader({icon, title, description, action}: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-8">
      <div className="flex min-w-0 items-start gap-8">
        <div className="flex size-32 flex-shrink-0 items-center justify-center rounded-panel bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight">{title}</div>
          {description ? (
            <div className="mt-2 max-w-[520px] text-[11px] leading-snug text-muted">
              {description}
            </div>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}

interface BillingCardProps {
  children: ReactNode;
  className?: string;
}
function BillingCard({children, className}: BillingCardProps) {
  return (
    <section
      className={clsx(
        'dashboard-rounded-panel bg-surface border border-divider p-18 shadow-sm md:p-24',
        className,
      )}
    >
      {children}
    </section>
  );
}

function PaymentStatusChip({status}: {status: BillingStatus}) {
  if (status === 'pending') {
    return (
      <Chip color="chip" size="sm">
        <Trans message="Payment Pending" />
      </Chip>
    );
  }
  if (status === 'rejected') {
    return (
      <Chip color="danger" size="sm">
        <Trans message="Payment Rejected" />
      </Chip>
    );
  }
  return (
    <Chip color="positive" size="sm">
      <Trans message="Good Standing" />
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

function AlertIcon({tone}: {tone: AlertTone}) {
  const className = clsx('flex-shrink-0', {
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

function alertToneClassName(tone: AlertTone): string {
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

function alertIconBgClassName(tone: AlertTone): string {
  switch (tone) {
    case 'critical':
      return 'bg-danger-lighter';
    case 'warning':
      return 'bg-warning/10';
    case 'success':
      return 'bg-positive-lighter';
    default:
      return 'bg-primary-light';
  }
}

function usageProgressColor(usagePercent: number): string {
  if (usagePercent >= 1) {
    return 'bg-danger';
  }
  if (usagePercent >= 0.9) {
    return 'bg-warning';
  }
  if (usagePercent >= 0.8) {
    return 'bg-warning';
  }
  return 'bg-positive';
}

function BillingSkeleton() {
  return (
    <Fragment>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-panel bg-alt" />
        <div className="h-72 animate-pulse rounded-panel bg-alt" />
      </div>
      <div className="grid grid-cols-1 items-start gap-16 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
        <div className="flex flex-col gap-16">
          <div className="h-[168px] animate-pulse rounded-panel bg-alt" />
          <div className="h-[300px] animate-pulse rounded-panel bg-alt" />
          <div className="h-[220px] animate-pulse rounded-panel bg-alt" />
        </div>
        <div className="flex flex-col gap-16">
          <div className="h-[220px] animate-pulse rounded-panel bg-alt" />
          <div className="h-[300px] animate-pulse rounded-panel bg-alt" />
        </div>
      </div>
    </Fragment>
  );
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
