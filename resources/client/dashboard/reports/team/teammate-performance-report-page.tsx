import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ReportLayout} from '@app/dashboard/reports/layout/report-layout';
import {useReportDateRange} from '@app/dashboard/reports/layout/use-date-range';
import {TeammatePerformanceTable} from '@app/dashboard/reports/team/teammate-performance-table';
import {ReportCard} from '@common/admin/analytics/admin-report-card-row';
import {ChartGridReportTable} from '@common/charts/report-table';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';
import {ConversationsReport} from '../types/conversations-report';

interface Report {
  agents: ConversationsReport['agents'];
}

export function Component() {
  const [dateRange, setDateRange] = useReportDateRange();
  const query = useQuery(
    helpdeskQueries.reports.get<Report>('reports/agents', dateRange),
  );
  return (
    <ReportLayout
      channel="teammates"
      title={<Trans message="Teammate performance" />}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <StaticPageTitle>
        <Trans message="Reports - Teammate performance" />
      </StaticPageTitle>
      <div className="chart-grid mb-20">
        <CardRow data={query.data?.agents} />
      </div>
      <ChartGridReportTable label={<Trans message="Detailed report" />}>
        <TeammatePerformanceTable report={query.data?.agents} />
      </ChartGridReportTable>
    </ReportLayout>
  );
}

interface CardRowProps {
  data?: ConversationsReport['agents'];
}

function CardRow({data}: CardRowProps) {
  const isLoading = !data;
  return (
    <Fragment>
      <ReportCard
        currentValue={data?.datasets[0]?.totalConversations ?? 0}
        previousValue={data?.datasets[1]?.totalConversations ?? undefined}
        isLoading={isLoading}
      >
        <Trans message="New Conversations" />
      </ReportCard>
      <ReportCard
        currentValue={data?.datasets[0]?.totalAgentReplies ?? 0}
        previousValue={data?.datasets[1]?.totalAgentReplies ?? undefined}
        isLoading={isLoading}
      >
        <Trans message="Total team replies" />
      </ReportCard>
      <ReportCard
        currentValue={data?.datasets[0]?.avgResponseTime ?? 0}
        previousValue={data?.datasets[1]?.avgResponseTime ?? undefined}
        isLoading={isLoading}
        type="durationInSeconds"
      >
        <Trans message="Average response time" />
      </ReportCard>
      <ReportCard
        type="percentage"
        currentValue={data?.datasets[0]?.satisfaction ?? null}
        previousValue={data?.datasets[1]?.satisfaction}
        isLoading={isLoading}
      >
        <Trans message="Satisfaction" />
      </ReportCard>
    </Fragment>
  );
}
