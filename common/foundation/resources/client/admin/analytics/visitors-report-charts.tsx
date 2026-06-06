import {GeoChart} from '@common/admin/analytics/geo-chart/geo-chart';
import {VisitorsReportData} from '@common/admin/analytics/visitors-report-data';
import {BarChart} from '@common/charts/bar-chart';
import {LineChart} from '@common/charts/line-chart';
import {PolarAreaChart} from '@common/charts/polar-area-chart';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react/jsx-runtime';

interface AdminReportChartsProps {
  report?: VisitorsReportData;
  isLoading: boolean;
}
export function VisitorsReportCharts({
  report,
  isLoading,
}: AdminReportChartsProps) {
  const totalViews = report?.pageViews.total;
  return (
    <Fragment>
      <LineChart
        colSpan="col-span-8"
        isLoading={isLoading}
        data={report?.pageViews}
        title={<Trans message="Pageviews" />}
        description={
          totalViews ? (
            <Trans
              message=":count total views"
              values={{count: <FormattedNumber value={totalViews} />}}
            />
          ) : null
        }
      />
      <PolarAreaChart
        colSpan="col-span-4"
        isLoading={isLoading}
        data={report?.devices}
        title={<Trans message="Top devices" />}
      />
      <GeoChart
        colSpan="col-span-7"
        isLoading={isLoading}
        data={report?.locations}
        title={<Trans message="Top locations" />}
      />
      <BarChart
        colSpan="col-span-5"
        isLoading={isLoading}
        data={report?.browsers}
        direction="horizontal"
        individualBarColors
        hideLegend
        title={<Trans message="Top browsers" />}
      />
    </Fragment>
  );
}
