import {
  PaymentRequest,
  RequestStatus,
  billingQueries,
} from '@app/dashboard/billing/requests/billing-queries';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {Trans} from '@ui/i18n/trans';
import {ArrowBackIcon} from '@ui/icons/material/ArrowBack';
import {OpenInNewIcon} from '@ui/icons/material/OpenInNew';
import {ReceiptLongIcon} from '@ui/icons/material/ReceiptLong';
import {Skeleton} from '@ui/skeleton/skeleton';
import {Link} from 'react-router';

export function Component() {
  const query = useQuery(billingQueries.paymentHistory());
  const payments = query.data?.paymentHistory ?? [];

  return (
    <div className="flex h-full flex-col">
      <StaticPageTitle>
        <Trans message="Payment History" />
      </StaticPageTitle>

      <DatatablePageHeaderBar showSidebarToggleButton>
        <div className="flex min-w-0 flex-auto items-center justify-between gap-12">
          <div className="min-w-0">
            <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
              <Trans message="Payment History" />
            </div>
            <div className="mt-2 text-xs font-normal text-muted">
              <Trans message="Recent billing payment records" />
            </div>
          </div>
          <Button
            size="xs"
            variant="outline"
            startIcon={<ArrowBackIcon />}
            elementType={Link}
            to="/dashboard/billing"
          >
            <Trans message="Billing" />
          </Button>
        </div>
      </DatatablePageHeaderBar>

      <div className="flex-auto overflow-y-auto p-12 stable-scrollbar md:p-24">
        <div className="mx-auto max-w-6xl rounded-panel border border-divider bg-paper">
          <div className="flex items-center gap-10 border-b border-divider px-16 py-14">
            <span className="flex size-32 items-center justify-center rounded-panel bg-primary/10 text-primary">
              <ReceiptLongIcon />
            </span>
            <div>
              <div className="font-semibold">
                <Trans message="All Payment History" />
              </div>
              <div className="mt-2 text-xs text-muted">
                <Trans message="Showing the latest billing payment records." />
              </div>
            </div>
          </div>

          {query.isPending ? (
            <HistorySkeleton />
          ) : payments.length ? (
            <PaymentHistoryTable payments={payments} />
          ) : (
            <div className="px-16 py-24 text-sm text-muted">
              <Trans message="No payment history yet." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentHistoryTable({payments}: {payments: PaymentRequest[]}) {
  return (
    <div>
      <div className="hidden grid-cols-[120px_minmax(120px,1fr)_110px_130px_120px_110px] gap-12 border-b border-divider px-14 py-10 text-xs font-medium uppercase text-muted lg:grid">
        <Trans message="Date" />
        <Trans message="Reference" />
        <Trans message="Type" />
        <div className="text-right">
          <Trans message="Amount" />
        </div>
        <Trans message="Crypto" />
        <div className="text-right">
          <Trans message="Status" />
        </div>
      </div>
      <div className="divide-y divide-divider">
        {payments.map(payment => (
          <PaymentHistoryRow key={payment.id} payment={payment} />
        ))}
      </div>
    </div>
  );
}

function PaymentHistoryRow({payment}: {payment: PaymentRequest}) {
  return (
    <div className="grid gap-8 px-14 py-12 text-sm lg:grid-cols-[120px_minmax(120px,1fr)_110px_130px_120px_110px] lg:items-center lg:gap-12">
      <div className="text-muted">{formatDate(payment.requestedAt)}</div>
      <div className="min-w-0">
        <div className="font-medium">{payment.reference}</div>
        <div className="mt-2 truncate text-xs text-muted">
          {payment.plan?.name ? `${payment.plan.name} Plan` : payment.notes}
        </div>
      </div>
      <div>{payment.type}</div>
      <div className="font-medium lg:text-right">
        {formatRupiah(payment.amount)}
      </div>
      <div className="text-xs text-muted">
        {payment.crypto.receivedAmount || payment.crypto.expectedAmount ? (
          <>
            {payment.crypto.receivedAmount || payment.crypto.expectedAmount}{' '}
            {payment.crypto.asset || 'USDT'}
          </>
        ) : (
          '-'
        )}
        {payment.crypto.scannerUrl ? (
          <a
            className="mt-2 inline-flex items-center gap-4 text-primary hover:underline"
            href={payment.crypto.scannerUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Trans message="Tronscan" />
            <OpenInNewIcon size="xs" />
          </a>
        ) : null}
      </div>
      <div className="lg:flex lg:justify-end">
        <RequestStatusChip status={payment.status} />
      </div>
    </div>
  );
}

function RequestStatusChip({status}: {status: RequestStatus}) {
  return (
    <Chip
      color={
        status === 'paid'
          ? 'positive'
          : status === 'rejected'
            ? 'danger'
            : 'chip'
      }
      size="xs"
    >
      {status === 'paid' ? (
        <Trans message="Paid" />
      ) : status === 'rejected' ? (
        <Trans message="Rejected" />
      ) : status === 'cancelled' ? (
        <Trans message="Cancelled" />
      ) : (
        <Trans message="Pending" />
      )}
    </Chip>
  );
}

function HistorySkeleton() {
  return (
    <div className="p-14">
      {Array.from({length: 8}).map((_, index) => (
        <Skeleton key={index} className="mb-10 h-54 w-full" />
      ))}
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
}
