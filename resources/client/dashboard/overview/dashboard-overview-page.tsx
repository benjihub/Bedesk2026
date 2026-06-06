import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useQuery} from '@tanstack/react-query';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Trans} from '@ui/i18n/trans';
import clsx from 'clsx';
import {ReactNode} from 'react';

type DashboardStats = {
  active_users: number;
  open_tickets: number;
  ai_responses: number;
  total_tickets: number;
  promotions: number;
};

export function Component() {
  const query = useQuery(helpdeskQueries.dashboard.stats);
  const stats = (query.data ?? {
    active_users: 0,
    open_tickets: 0,
    ai_responses: 0,
    total_tickets: 0,
    promotions: 0,
  }) as DashboardStats;

  const isError = query.isError || (query.data && (query.data as any).error);

  return (
    <div className="flex h-full flex-col">
      <StaticPageTitle>
        <Trans message="Dashboard" />
      </StaticPageTitle>

      <DatatablePageHeaderBar showSidebarToggleButton>
        <Trans message="Dashboard" />
      </DatatablePageHeaderBar>

      <div className="flex-auto overflow-y-auto p-12 stable-scrollbar md:p-24">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
          <StatCard
            label={<Trans message="Active users" />}
            value={stats.active_users}
            isLoading={query.isLoading}
            isError={isError}
          />
          <StatCard
            label={<Trans message="Open tickets" />}
            value={stats.open_tickets}
            isLoading={query.isLoading}
            isError={isError}
          />
          <StatCard
            label={<Trans message="Promotions" />}
            value={stats.promotions}
            isLoading={query.isLoading}
            isError={isError}
          />
          <StatCard
            className="md:col-span-2"
            label={<Trans message="AI responses" />}
            value={stats.ai_responses}
            isLoading={query.isLoading}
            isError={isError}
          />
          <StatCard
            label={<Trans message="Total tickets" />}
            value={stats.total_tickets}
            isLoading={query.isLoading}
            isError={isError}
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: ReactNode;
  value: number;
  isLoading?: boolean;
  className?: string;
}

function StatCard({label, value, isLoading, className, isError}: StatCardProps & {isError?: boolean}) {
  const showPlaceholder = isLoading || isError;
  return (
    <div
      className={clsx(
        'dashboard-rounded-panel flex min-h-120 flex-col justify-center px-24 py-18',
        className,
      )}
    >
      <div
        className={clsx('text-4xl font-semibold', showPlaceholder && 'opacity-60')}
      >
        {showPlaceholder ? '—' : value}
      </div>
      <div className="mt-8 text-xs tracking-widest text-muted">{label}</div>
    </div>
  );
}
