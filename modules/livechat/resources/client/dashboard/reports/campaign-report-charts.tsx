import {GeoChart} from '@common/admin/analytics/geo-chart/geo-chart';
import {BarChart} from '@common/charts/bar-chart';
import {LineChart} from '@common/charts/line-chart';
import {PolarAreaChart} from '@common/charts/polar-area-chart';
import {CampaignReport} from '@livechat/dashboard/reports/use-campaign-report';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';
import {ReactNode} from 'react';

interface CampaignReportPageProps {
  isLoading: boolean;
  data: CampaignReport | undefined;
  country?: string;
  setCountry?: (country?: string) => void;
  children?: ReactNode;
}
export function CampaignReportCharts({
  isLoading,
  data,
  country,
  setCountry,
  children,
}: CampaignReportPageProps) {
  return (
    <section className="chart-grid">
      <LineChart
        isLoading={isLoading}
        data={data?.impressions}
        colSpan="col-span-12"
        title={<Trans message="Impression count" />}
        description={
          <Trans
            message=":count total impressions"
            values={{
              count: <FormattedNumber value={data?.impressions.total || 0} />,
            }}
          />
        }
      />
      {children}
      <GeoChart
        onCountrySelected={setCountry}
        country={country}
        isLoading={isLoading}
        data={country ? data?.cities : data?.countries}
      />
      <PolarAreaChart
        colSpan="col-span-5"
        title={<Trans message="Top devices" />}
        isLoading={isLoading}
        data={data?.devices}
      />
      <BarChart
        direction="horizontal"
        individualBarColors
        hideLegend
        title={<Trans message="Top browsers" />}
        isLoading={isLoading}
        data={data?.browsers}
      />
      <PolarAreaChart
        title={<Trans message="Top platforms" />}
        isLoading={isLoading}
        data={data?.platforms}
      />
    </section>
  );
}
