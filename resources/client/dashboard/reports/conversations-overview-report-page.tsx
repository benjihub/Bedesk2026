import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ReportLayout} from '@app/dashboard/reports/layout/report-layout';
import {useReportDateRange} from '@app/dashboard/reports/layout/use-date-range';
import {TeammatePerformanceTable} from '@app/dashboard/reports/team/teammate-performance-table';
import {ReportCard} from '@common/admin/analytics/admin-report-card-row';
import {ReportDateFooter} from '@common/admin/analytics/report-date-footer';
import {BarChart} from '@common/charts/bar-chart';
import {BusiestTimeOfDayChart} from '@common/charts/busiest-time-of-day-chart';
import {LineChart} from '@common/charts/line-chart';
import {ChartGridReportTable} from '@common/charts/report-table';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {FormattedDuration} from '@ui/i18n/formatted-duration';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';
import {Link, useLocation} from 'react-router';
import {ConversationsReport} from './types/conversations-report';

export function Component() {
  const {pathname} = useLocation();
  const modelType = pathname.split('/').pop() === 'tickets' ? 'ticket' : 'chat';
  const [dateRange, setDateRange] = useReportDateRange();
  const query = useQuery(
    helpdeskQueries.reports.get<ConversationsReport>(
      `reports/conversations/${modelType}`,
      dateRange,
    ),
  );
  return (
    <ReportLayout
      dateRange={dateRange}
      channel={modelType === 'ticket' ? 'tickets' : 'chats'}
      onDateRangeChange={setDateRange}
      title={
        modelType === 'ticket' ? (
          <Trans message="Tickets" />
        ) : (
          <Trans message="Chats" />
        )
      }
    >
      <StaticPageTitle>
        {modelType === 'ticket' ? (
          <Trans message="Reports - Tickets" />
        ) : (
          <Trans message="Reports - Chats" />
        )}
      </StaticPageTitle>
      <div className="chart-grid">
        <CardRow data={query.data} />
        <LineChart
          colSpan="col-span-8"
          data={query.data?.newConversations}
          isLoading={query.isLoading}
          title={<Trans message="New conversations" />}
          hideLegend
          description={
            <Trans
              message=":count total conversations"
              values={{
                count: (
                  <FormattedNumber
                    value={
                      query.data?.newConversations?.datasets[0]?.total || 0
                    }
                  />
                ),
              }}
            />
          }
        />
        <BarChart
          colSpan="col-span-4"
          data={query.data?.firstReplyTimes}
          direction="vertical"
          individualBarColors
          isLoading={query.isLoading}
          hideLegend
          title={
            modelType === 'ticket' ? (
              <Trans message="Hours until first agent reply" />
            ) : (
              <Trans message="Minutes until first agent reply" />
            )
          }
          description={
            query.data?.firstReplyTimes.datasets[0]?.average ? (
              <Trans
                message=":time average"
                values={{
                  time: (
                    <FormattedDuration
                      seconds={
                        query.data?.firstReplyTimes.datasets[0]?.average || 0
                      }
                      verbose
                    />
                  ),
                }}
              />
            ) : null
          }
        />
        <BusiestTimeOfDayChart report={query.data?.busiestTimeOfDay} />
        <BarChart
          colSpan="col-span-5"
          title={<Trans message="Conversations by tag" />}
          data={query.data?.tags}
          direction="horizontal"
          isLoading={query.isLoading}
          individualBarColors
          hideLegend
        />
        <ChartGridReportTable
          label={<Trans message="Teammate performance" />}
          actions={
            <Button
              variant="outline"
              color="primary"
              elementType={Link}
              to="../teammates"
              relative="path"
              size="xs"
            >
              <Trans message="View all" />
            </Button>
          }
        >
          <TeammatePerformanceTable report={query.data?.agents} />
        </ChartGridReportTable>
      </div>
      {query.data?.newConversations.generatedAt ? (
        <ReportDateFooter date={query.data.newConversations.generatedAt} />
      ) : null}
    </ReportLayout>
  );
}

interface CardRowProps {
  data?: ConversationsReport;
}

function CardRow({data}: CardRowProps) {
  const value = data?.newConversations.datasets[0];
  const prevValue = data?.newConversations.datasets[1];
  const isLoading = !data;
  return (
    <Fragment>
      <ReportCard
        currentValue={value?.total ?? 0}
        previousValue={prevValue?.total ?? undefined}
        isLoading={isLoading}
      >
        <Trans message="New Conversations" />
      </ReportCard>
      <ReportCard
        currentValue={data?.agents?.datasets[0]?.totalAgentReplies ?? 0}
        previousValue={
          data?.agents?.datasets[1]?.totalAgentReplies ?? undefined
        }
        isLoading={isLoading}
      >
        <Trans message="Total agent replies" />
      </ReportCard>
      <ReportCard
        currentValue={data?.agents?.datasets[0]?.avgResponseTime ?? 0}
        previousValue={data?.agents?.datasets[1]?.avgResponseTime ?? undefined}
        isLoading={isLoading}
        type="durationInSeconds"
      >
        <Trans message="Average response time" />
      </ReportCard>
      <ReportCard
        type="percentage"
        currentValue={value?.solvedOnFirstReplyPercentage ?? 0}
        previousValue={prevValue?.solvedOnFirstReplyPercentage ?? undefined}
        isLoading={isLoading}
      >
        <Trans message="Closed on first reply" />
      </ReportCard>
    </Fragment>
  );
}
