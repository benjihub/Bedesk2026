import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ReportLayout} from '@app/dashboard/reports/layout/report-layout';
import {useReportDateRange} from '@app/dashboard/reports/layout/use-date-range';
import {ReportCard} from '@common/admin/analytics/admin-report-card-row';
import {DatasetItem, ReportMetric} from '@common/admin/analytics/report-metric';
import {LineChart} from '@common/charts/line-chart';
import {PolarAreaChart} from '@common/charts/polar-area-chart';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useQuery} from '@tanstack/react-query';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';

interface Report {
  aiAgentConversations: ReportMetric<
    DatasetItem,
    {
      total: number;
      totalInvolved: number;
      totalResolved: number;
      totalEscalated: number;
    }
  >;
  aiAgentInvolvment: ReportMetric<DatasetItem>;
  aiAgentInvolvmentOverTime: ReportMetric<DatasetItem, {totalInvolved: number}>;
}

export function Component() {
  const [dateRange, setDateRange] = useReportDateRange();
  const query = useQuery(
    helpdeskQueries.reports.get<Report>('reports/ai-agent', dateRange),
  );
  return (
    <ReportLayout
      channel="ai-agent"
      title={<Trans message="AI Agent" />}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <StaticPageTitle>
        <Trans message="Reports - AI Agent" />
      </StaticPageTitle>
      <div className="chart-grid mb-20">
        <CardRow data={query.data?.aiAgentConversations} />
        <LineChart
          colSpan="col-span-12"
          data={query.data?.aiAgentConversations}
          isLoading={query.isLoading}
          title={<Trans message="Resolved by AI agent" />}
          hideLegend
          description={
            <Trans
              message=":resolvedCount of :count total conversations"
              values={{
                resolvedCount: (
                  <FormattedNumber
                    value={
                      query.data?.aiAgentConversations?.datasets[0]
                        ?.totalResolved || 0
                    }
                  />
                ),
                count: (
                  <FormattedNumber
                    value={
                      query.data?.aiAgentConversations?.datasets[0]?.total || 0
                    }
                  />
                ),
              }}
            />
          }
        />
        <PolarAreaChart
          colSpan="col-span-4"
          title={<Trans message="AI agent involvement" />}
          data={query.data?.aiAgentInvolvment}
          isLoading={query.isLoading}
        />
        <LineChart
          colSpan="col-span-8"
          data={query.data?.aiAgentInvolvmentOverTime}
          isLoading={query.isLoading}
          title={<Trans message="AI agent involvement over time" />}
          hideLegend
          description={
            <Trans
              message=":involvedCount of :count total conversations"
              values={{
                involvedCount: (
                  <FormattedNumber
                    value={
                      query.data?.aiAgentInvolvmentOverTime?.datasets[0]
                        ?.totalInvolved || 0
                    }
                  />
                ),
                count: (
                  <FormattedNumber
                    value={
                      query.data?.aiAgentConversations?.datasets[0]?.total || 0
                    }
                  />
                ),
              }}
            />
          }
        />
      </div>
    </ReportLayout>
  );
}

interface CardRowProps {
  data?: Report['aiAgentConversations'];
}

function CardRow({data}: CardRowProps) {
  const isLoading = !data;
  return (
    <Fragment>
      <ReportCard
        currentValue={data?.datasets[0]?.total ?? 0}
        previousValue={data?.datasets[1]?.total ?? undefined}
        isLoading={isLoading}
      >
        <Trans message="Total Conversations" />
      </ReportCard>
      <ReportCard
        currentValue={data?.datasets[0]?.totalInvolved ?? 0}
        previousValue={data?.datasets[1]?.totalInvolved ?? undefined}
        isLoading={isLoading}
      >
        <Trans message="AI agent involved" />
      </ReportCard>
      <ReportCard
        currentValue={data?.datasets[0]?.totalResolved ?? 0}
        previousValue={data?.datasets[1]?.totalResolved ?? undefined}
        isLoading={isLoading}
      >
        <Trans message="Resolved by AI agent" />
      </ReportCard>
      <ReportCard
        currentValue={data?.datasets[0]?.totalEscalated ?? 0}
        previousValue={data?.datasets[1]?.totalEscalated ?? undefined}
        isLoading={isLoading}
      >
        <Trans message="Escalated to team" />
      </ReportCard>
    </Fragment>
  );
}
