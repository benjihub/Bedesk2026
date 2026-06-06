import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ReportLayout} from '@app/dashboard/reports/layout/report-layout';
import {useReportDateRange} from '@app/dashboard/reports/layout/use-date-range';
import {VisitorsReportCharts} from '@common/admin/analytics/visitors-report-charts';
import {VisitorsReportData} from '@common/admin/analytics/visitors-report-data';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';

export function Component() {
  const [dateRange, setDateRange] = useReportDateRange();
  const query = useQuery(
    helpdeskQueries.reports.get<{visitorsReport: VisitorsReportData}>(
      'admin/reports',
      dateRange,
    ),
  );
  return (
    <ReportLayout
      channel="analytics"
      title={<Trans message="Google Analytics" />}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <StaticPageTitle>
        <Trans message="Reports - Google Analytics" />
      </StaticPageTitle>
      <div className="chart-grid">
        <VisitorsReportCharts
          isLoading={query.isLoading || query.isPlaceholderData}
          report={query.data?.visitorsReport}
        />
      </div>
    </ReportLayout>
  );
}
