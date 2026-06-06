import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ReportLayout} from '@app/dashboard/reports/layout/report-layout';
import {useReportDateRange} from '@app/dashboard/reports/layout/use-date-range';
import {DatasetItem, ReportMetric} from '@common/admin/analytics/report-metric';
import {BarChart} from '@common/charts/bar-chart';
import {LineChart} from '@common/charts/line-chart';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useQuery} from '@tanstack/react-query';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';

interface EnvatoReportResponse extends BackendResponse {
  earnings: ReportMetric<
    DatasetItem,
    {
      total: number;
    }
  >;
  earningsVsTickets: ReportMetric<
    DatasetItem,
    {
      total: number;
    }
  >;
  items: ReportMetric<{label: string; value: number}>;
  countries: ReportMetric<{label: string; value: number}>;
}

export function Component() {
  const [dateRange, setDateRange] = useReportDateRange();
  const query = useQuery(
    helpdeskQueries.reports.get<EnvatoReportResponse>(
      'reports/envato',
      dateRange,
    ),
  );
  return (
    <ReportLayout
      channel="envato"
      title={<Trans message="Envato" />}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <StaticPageTitle>
        <Trans message="Reports - Envato" />
      </StaticPageTitle>
      <div className="chart-grid">
        <LineChart
          colSpan="col-span-8"
          data={query.data?.earnings}
          className="flex-auto"
          isLoading={query.isLoading}
          title={<Trans message="Earnings" />}
          hideLegend
          description={
            <Trans
              message=":count total"
              values={{
                count: (
                  <FormattedNumber
                    value={query.data?.earnings?.datasets[0]?.total || 0}
                  />
                ),
              }}
            />
          }
        />
        <BarChart
          colSpan="col-span-4"
          data={query.data?.items}
          direction="horizontal"
          isLoading={query.isLoading}
          individualBarColors
          hideLegend
          title={<Trans message="Earnings by item" />}
        />
        <LineChart
          colSpan="col-span-8"
          data={query.data?.earningsVsTickets}
          className="flex-auto"
          isLoading={query.isLoading}
          title={<Trans message="Earnings vs tickets" />}
        />
        <BarChart
          colSpan="col-span-4"
          data={query.data?.countries}
          direction="horizontal"
          isLoading={query.isLoading}
          individualBarColors
          hideLegend
          title={<Trans message="Earnings by country" />}
        />
      </div>
    </ReportLayout>
  );
}
