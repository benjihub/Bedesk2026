import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ReportLayout} from '@app/dashboard/reports/layout/report-layout';
import {useReportDateRange} from '@app/dashboard/reports/layout/use-date-range';
import {LineChart} from '@common/charts/line-chart';
import {
  ChartGridReportTable,
  ReportTable,
  ReportTableCell,
  ReportTableItem,
} from '@common/charts/report-table';
import {ColumnConfig} from '@common/datatable/column-config';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useQuery} from '@tanstack/react-query';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';
import {Skeleton} from '@ui/skeleton/skeleton';
import {ConversationsReport} from './types/conversations-report';
import {TagsReportDatasetItem} from './types/tags-report-dataset-item';

interface Report {
  tags: ConversationsReport['tags'];
  taggedConversations: ConversationsReport['taggedConversations'];
}

export function Component() {
  const [dateRange, setDateRange] = useReportDateRange();
  const query = useQuery(
    helpdeskQueries.reports.get<Report>('reports/tags', dateRange),
  );
  return (
    <ReportLayout
      channel="tags"
      title={<Trans message="Tags" />}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <StaticPageTitle>
        <Trans message="Reports - Tags" />
      </StaticPageTitle>
      <div className="chart-grid mb-20">
        <LineChart
          colSpan="col-span-12"
          data={query.data?.taggedConversations}
          isLoading={query.isLoading}
          title={<Trans message="Tagged conversations" />}
          hideLegend
          description={
            <Trans
              message=":taggedCount of :count total conversations"
              values={{
                taggedCount: (
                  <FormattedNumber
                    value={
                      query.data?.taggedConversations?.datasets[0]
                        ?.taggedTotal || 0
                    }
                  />
                ),
                count: (
                  <FormattedNumber
                    value={
                      query.data?.taggedConversations?.datasets[0]?.total || 0
                    }
                  />
                ),
              }}
            />
          }
        />
      </div>
      <ChartGridReportTable label={<Trans message="Detailed report" />}>
        <TagsTable report={query.data?.tags} />
      </ChartGridReportTable>
    </ReportLayout>
  );
}

const columns: ColumnConfig<ReportTableItem<TagsReportDatasetItem>>[] = [
  {
    key: 'name',
    visibleInMode: 'all',
    header: () => <Trans message="Tag name" />,
    body: (item, row) =>
      row.isPlaceholder ? <Skeleton size="w-120" /> : item.data.label,
  },
  {
    key: 'conversationCount',
    header: () => <Trans message="Conversations" />,
    body: (item, row) => (
      <ReportTableCell
        name="value"
        item={item}
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
  {
    key: 'percentageOfConversations',
    header: () => <Trans message="% of all conversations" />,
    body: (item, row) => (
      <ReportTableCell
        name="percentageOfConversations"
        item={item}
        type="percent"
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
];

interface TagsTableProps {
  report: ConversationsReport['tags'] | undefined;
}
function TagsTable({report}: TagsTableProps) {
  return <ReportTable columns={columns} report={report} cellHeight="h-40" />;
}
