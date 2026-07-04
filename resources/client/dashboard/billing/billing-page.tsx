import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Button} from '@ui/buttons/button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';
import {AddCardIcon} from '@ui/icons/material/AddCard';
import {AutoAwesomeIcon} from '@ui/icons/material/AutoAwesome';
import {CalendarTodayIcon} from '@ui/icons/material/CalendarToday';
import {CheckCircleIcon} from '@ui/icons/material/CheckCircle';
import {CreditScoreIcon} from '@ui/icons/material/CreditScore';
import {ErrorOutlineIcon} from '@ui/icons/material/ErrorOutline';
import {InfoIcon} from '@ui/icons/material/Info';
import {PaymentsIcon} from '@ui/icons/material/Payments';
import {ReceiptLongIcon} from '@ui/icons/material/ReceiptLong';
import {UpgradeIcon} from '@ui/icons/material/Upgrade';
import {WarningAmberIcon} from '@ui/icons/material/WarningAmber';
import {ProgressBar} from '@ui/progress/progress-bar';
import clsx from 'clsx';
import {Fragment, ReactNode} from 'react';

type BillingPlanName = 'Economy' | 'Basic' | 'Premium' | 'Professional';
type BillingStatus = 'good' | 'pending' | 'rejected';
type AlertTone = 'info' | 'warning' | 'critical';
type RequestStatus = 'pending' | 'paid' | 'rejected';

interface BillingPlan {
  name: BillingPlanName;
  price: number;
  quota: number;
  current?: boolean;
}

interface TopUpBatch {
  id: number;
  purchasedCredits: number;
  usedCredits: number;
  expiresAt: string;
  status: 'active' | 'in_use' | 'expired';
}

interface PaymentRequest {
  id: number;
  type: 'Plan Renewal' | 'Top-Up' | 'Plan Upgrade';
  amount: number;
  requestedAt: string;
  status: RequestStatus;
  notes: string;
}

interface BillingAlert {
  tone: AlertTone;
  title: string;
  message: string;
}

const plans: BillingPlan[] = [
  {name: 'Economy', price: 750000, quota: 7500},
  {name: 'Basic', price: 2500000, quota: 30000},
  {name: 'Premium', price: 4000000, quota: 90000, current: true},
  {name: 'Professional', price: 8000000, quota: 300000},
];

const billingSummary = {
  accountName: 'Company Account',
  plan: plans[2],
  status: 'good' as BillingStatus,
  cycleStart: 'Jul 1, 2026',
  cycleEnd: 'Jul 31, 2026',
  renewalDate: 'Aug 1, 2026',
  monthlyUsed: 68400,
  topUps: [
    {
      id: 1,
      purchasedCredits: 60000,
      usedCredits: 0,
      expiresAt: 'Aug 15, 2026',
      status: 'active',
    },
  ] as TopUpBatch[],
  alerts: [
    {
      tone: 'warning',
      title: 'Usage is approaching the monthly quota',
      message:
        'You have used 76% of this cycle. Top-up credits will be used only after monthly credits run out.',
    },
    {
      tone: 'info',
      title: 'Manual payment confirmation is enabled',
      message:
        'Requests are activated after our team confirms payment outside the app.',
    },
  ] satisfies BillingAlert[],
  pendingRequests: [
    {
      id: 1005,
      type: 'Top-Up',
      amount: 2000000,
      requestedAt: 'Jul 4, 2026',
      status: 'pending',
      notes: 'Waiting for payment confirmation',
    },
  ] satisfies PaymentRequest[],
  paymentHistory: [
    {
      id: 1004,
      type: 'Plan Renewal',
      amount: 4000000,
      requestedAt: 'Jul 1, 2026',
      status: 'paid',
      notes: 'Monthly plan renewal',
    },
    {
      id: 1003,
      type: 'Top-Up',
      amount: 2000000,
      requestedAt: 'Jun 18, 2026',
      status: 'paid',
      notes: 'AI reply credit top-up',
    },
    {
      id: 1002,
      type: 'Plan Upgrade',
      amount: 4000000,
      requestedAt: 'Jun 1, 2026',
      status: 'paid',
      notes: 'Plan change approved',
    },
  ] satisfies PaymentRequest[],
};

export function Component() {
  const monthlyRemaining = Math.max(
    billingSummary.plan.quota - billingSummary.monthlyUsed,
    0,
  );
  const monthlyUsagePercent =
    billingSummary.monthlyUsed / billingSummary.plan.quota;
  const topUpCredits = billingSummary.topUps.reduce(
    (total, batch) =>
      batch.status === 'expired'
        ? total
        : total + batch.purchasedCredits - batch.usedCredits,
    0,
  );
  const monthlyQuotaExhausted =
    billingSummary.monthlyUsed >= billingSummary.plan.quota;
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
              {billingSummary.accountName}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-8 max-sm:hidden">
            <Button
              variant="outline"
              color="primary"
              startIcon={<UpgradeIcon />}
            >
              <Trans message="Request Upgrade" />
            </Button>
            <Button variant="flat" color="primary" startIcon={<AddCardIcon />}>
              <Trans message="Request Top-Up" />
            </Button>
          </div>
        </div>
      </DatatablePageHeaderBar>

      <div className="flex-auto overflow-y-auto p-12 stable-scrollbar md:p-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-16">
          <div className="flex gap-8 sm:hidden">
            <Button
              className="flex-1"
              variant="outline"
              color="primary"
              startIcon={<UpgradeIcon />}
            >
              <Trans message="Upgrade" />
            </Button>
            <Button
              className="flex-1"
              variant="flat"
              color="primary"
              startIcon={<AddCardIcon />}
            >
              <Trans message="Top-Up" />
            </Button>
          </div>

          <AlertStack alerts={billingSummary.alerts} />

          <div className="grid grid-cols-1 gap-16 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]">
            <div className="flex min-w-0 flex-col gap-16">
              <CurrentPlanCard />
              <UsageCard
                monthlyRemaining={monthlyRemaining}
                monthlyUsagePercent={monthlyUsagePercent}
                topUpCredits={topUpCredits}
                isTopUpInUse={isTopUpInUse}
              />
              <PaymentHistoryCard />
            </div>
            <div className="flex min-w-0 flex-col gap-16">
              <PaymentStatusCard />
              <PlanComparisonCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentPlanCard() {
  return (
    <BillingCard>
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
      <div className="mt-20 grid gap-16 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-10">
            <div className="text-2xl font-semibold">
              {billingSummary.plan.name} <Trans message="Plan" />
            </div>
            <Chip color="primary" size="xs">
              <Trans message="Current" />
            </Chip>
          </div>
          <div className="mt-8 text-sm text-muted">
            <Trans message="Billing cycle" />: {billingSummary.cycleStart} -{' '}
            {billingSummary.cycleEnd}
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm text-muted">
            <CalendarTodayIcon size="xs" />
            <span>
              <Trans message="Renews on" /> {billingSummary.renewalDate}
            </span>
          </div>
        </div>
        <div className="rounded-panel border border-divider bg-alt/50 px-16 py-14 md:text-right">
          <div className="text-xs font-medium uppercase text-muted">
            <Trans message="Monthly price" />
          </div>
          <div className="mt-6 text-xl font-semibold">
            {formatRupiah(billingSummary.plan.price)}
          </div>
          <div className="mt-4 text-xs text-muted">
            <Trans message="Manual payment confirmation" />
          </div>
        </div>
      </div>
    </BillingCard>
  );
}

interface UsageCardProps {
  monthlyRemaining: number;
  monthlyUsagePercent: number;
  topUpCredits: number;
  isTopUpInUse: boolean;
}
function UsageCard({
  monthlyRemaining,
  monthlyUsagePercent,
  topUpCredits,
  isTopUpInUse,
}: UsageCardProps) {
  const progressColor = usageProgressColor(monthlyUsagePercent);
  return (
    <BillingCard>
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

      <div className="mt-20">
        <div className="flex flex-wrap items-end justify-between gap-12">
          <div className="min-w-0">
            <div className="text-3xl font-semibold">
              <FormattedNumber value={billingSummary.monthlyUsed} />{' '}
              <span className="text-base font-normal text-muted">
                / <FormattedNumber value={billingSummary.plan.quota} />{' '}
                <Trans message="used" />
              </span>
            </div>
          </div>
          <div className="rounded-full bg-alt px-10 py-4 text-xs font-medium text-muted">
            <FormattedNumber value={Math.round(monthlyUsagePercent * 100)} />{' '}
            <Trans message="% used" />
          </div>
        </div>
        <ProgressBar
          className="mt-16"
          value={billingSummary.monthlyUsed}
          maxValue={billingSummary.plan.quota}
          trackHeight="h-12"
          radius="rounded-full"
          trackColor="bg-chip"
          progressColor={progressColor}
          showValueLabel={false}
        />
        <div className="mt-12 flex flex-wrap items-center justify-between gap-8 text-sm">
          <span className="font-medium">
            <FormattedNumber value={monthlyRemaining} />{' '}
            <Trans message="monthly credits remaining" />
          </span>
          <span className="text-muted">
            <Trans message="Usage resets on your renewal date. Unused credits do not roll over." />
          </span>
        </div>
      </div>

      <div className="mt-18 grid gap-12 md:grid-cols-3">
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

      <TopUpDetails isTopUpInUse={isTopUpInUse} />
    </BillingCard>
  );
}

function TopUpDetails({isTopUpInUse}: {isTopUpInUse: boolean}) {
  if (!billingSummary.topUps.length) {
    return (
      <div className="mt-18 border-t border-divider pt-16 text-sm text-muted">
        <Trans message="No active top-up. Running low? You can top up anytime." />
      </div>
    );
  }

  return (
    <div className="mt-18 border-t border-divider pt-16">
      <div className="flex flex-wrap items-center justify-between gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-8 font-medium">
            <Trans message="Top-Up Credits" />
            <Chip color={isTopUpInUse ? 'primary' : 'chip'} size="xs">
              {isTopUpInUse ? (
                <Trans message="In use" />
              ) : (
                <Trans message="Not yet in use" />
              )}
            </Chip>
          </div>
          <div className="mt-2 text-xs text-muted">
            <Trans message="Top-up credits are used only after monthly quota runs out." />
          </div>
        </div>
        <Chip color="chip" size="xs">
          <Trans message="Oldest expiry used first" />
        </Chip>
      </div>
      <div className="mt-12 flex flex-col gap-8">
        {billingSummary.topUps.map(batch => {
          const remaining = batch.purchasedCredits - batch.usedCredits;
          return (
            <div
              key={batch.id}
              className="grid gap-10 rounded-panel border border-divider bg-alt/30 px-14 py-12 sm:grid-cols-[minmax(0,1fr)_150px]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-8">
                  <span className="font-medium">
                    <FormattedNumber value={remaining} /> /{' '}
                    <FormattedNumber value={batch.purchasedCredits} />{' '}
                    <Trans message="credits available" />
                  </span>
                  <TopUpStatusChip status={batch.status} />
                </div>
                <ProgressBar
                  className="mt-10"
                  value={batch.usedCredits}
                  maxValue={batch.purchasedCredits}
                  trackHeight="h-6"
                  radius="rounded-full"
                  trackColor="bg-primary-light"
                  progressColor="bg-primary"
                  showValueLabel={false}
                />
              </div>
              <div className="text-sm text-muted sm:text-right">
                <Trans message="Expires" />
                <div className="mt-2 font-medium text-main">
                  {batch.expiresAt}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaymentStatusCard() {
  return (
    <BillingCard>
      <CardHeader
        icon={<PaymentsIcon />}
        title={<Trans message="Payment Status" />}
        description={<Trans message="Manual confirmation by our team" />}
        action={<PaymentStatusChip status={billingSummary.status} />}
      />
      <div className="mt-20 rounded-panel bg-positive-lighter px-14 py-12 text-sm text-positive-darker">
        <div className="flex items-start gap-10">
          <CheckCircleIcon className="mt-2 flex-shrink-0" size="sm" />
          <div>
            <div className="font-medium">
              <Trans message="Your account is in good standing." />
            </div>
            <div className="mt-4">
              <Trans message="Plan and top-up requests activate after payment is confirmed manually." />
            </div>
          </div>
        </div>
      </div>

      {billingSummary.pendingRequests.length ? (
        <Fragment>
          <div className="mt-20 text-sm font-medium">
            <Trans message="Pending Requests" />
          </div>
          <div className="mt-10 flex flex-col gap-10">
            {billingSummary.pendingRequests.map(request => (
              <PaymentRequestRow key={request.id} request={request} compact />
            ))}
          </div>
        </Fragment>
      ) : null}
    </BillingCard>
  );
}

function PaymentHistoryCard() {
  return (
    <BillingCard>
      <CardHeader
        icon={<ReceiptLongIcon />}
        title={<Trans message="Payment History" />}
        description={<Trans message="Most recent manual confirmations" />}
      />
      <div className="mt-18 overflow-hidden">
        <div className="hidden grid-cols-[130px_minmax(0,1fr)_150px_100px] gap-12 border-b border-divider px-10 pb-10 text-xs font-medium uppercase text-muted md:grid">
          <Trans message="Date" />
          <Trans message="Type" />
          <Trans message="Amount" />
          <Trans message="Status" />
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

function PlanComparisonCard() {
  return (
    <BillingCard>
      <CardHeader
        icon={<UpgradeIcon />}
        title={<Trans message="Compare Plans" />}
        description={<Trans message="Monthly AI Reply Credit packages" />}
      />
      <div className="mt-18 flex flex-col gap-10">
        {plans.map(plan => (
          <div
            key={plan.name}
            className={clsx(
              'rounded-panel border px-14 py-12',
              plan.current
                ? 'border-primary bg-primary-light/30'
                : 'border-divider',
            )}
          >
            <div className="flex items-start justify-between gap-12">
              <div>
                <div className="flex flex-wrap items-center gap-8 font-medium">
                  {plan.name} <Trans message="Plan" />
                  {plan.current ? (
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
              <div className="text-right text-sm font-semibold">
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
function PaymentRequestRow({request, compact}: PaymentRequestRowProps) {
  if (compact) {
    return (
      <div className="rounded-panel border border-divider bg-alt/30 px-14 py-12">
        <div className="flex items-start justify-between gap-12">
          <div>
            <div className="font-medium">{request.type}</div>
            <div className="mt-4 text-xs text-muted">
              {request.requestedAt} - {request.notes}
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{formatRupiah(request.amount)}</div>
            <div className="mt-6 flex justify-end">
              <RequestStatusChip status={request.status} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 px-10 py-14 text-sm md:grid-cols-[130px_minmax(0,1fr)_150px_100px] md:gap-12">
      <div className="text-muted">{request.requestedAt}</div>
      <div>
        <div className="font-medium">{request.type}</div>
        <div className="mt-2 text-xs text-muted">{request.notes}</div>
      </div>
      <div className="font-medium">{formatRupiah(request.amount)}</div>
      <RequestStatusChip status={request.status} />
    </div>
  );
}

interface UsageMetricProps {
  label: ReactNode;
  value: ReactNode;
  icon: ReactNode;
}
function UsageMetric({label, value, icon}: UsageMetricProps) {
  return (
    <div className="rounded-panel border border-divider bg-alt/30 px-14 py-12">
      <div className="flex items-center gap-8 text-xs font-medium uppercase text-muted">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-10 text-xl font-semibold">{value}</div>
    </div>
  );
}

interface AlertStackProps {
  alerts: BillingAlert[];
}
function AlertStack({alerts}: AlertStackProps) {
  if (!alerts.length) return null;
  return (
    <div className="flex flex-col gap-8">
      {alerts.slice(0, 2).map(alert => (
        <div
          key={alert.title}
          className={clsx(
            'rounded-panel border px-14 py-12',
            alertToneClassName(alert.tone),
          )}
        >
          <div className="flex gap-10">
            <span
              className={clsx(
                'flex size-28 flex-shrink-0 items-center justify-center rounded-full',
                alertIconBgClassName(alert.tone),
              )}
            >
              <AlertIcon tone={alert.tone} />
            </span>
            <div className="min-w-0">
              <div className="font-medium">{alert.title}</div>
              <div className="mt-3 text-sm text-muted">{alert.message}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface CardHeaderProps {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}
function CardHeader({icon, title, description, action}: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-16">
      <div className="flex min-w-0 items-start gap-12">
        <div className="flex size-38 flex-shrink-0 items-center justify-center rounded-panel bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold">{title}</div>
          {description ? (
            <div className="mt-3 text-xs text-muted">{description}</div>
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
    'text-warning': tone === 'warning',
    'text-danger': tone === 'critical',
  });
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

function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
}
