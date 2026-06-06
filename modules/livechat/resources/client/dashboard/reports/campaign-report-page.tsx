import {ReportLayout} from '@app/dashboard/reports/layout/report-layout';
import {useReportDateRange} from '@app/dashboard/reports/layout/use-date-range';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {CampaignReportCharts} from '@livechat/dashboard/reports/campaign-report-charts';
import {useCampaignReport} from '@livechat/dashboard/reports/use-campaign-report';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Trans} from '@ui/i18n/trans';
import {Skeleton} from '@ui/skeleton/skeleton';
import {useState} from 'react';

export function Component() {
  const [dateRange, setDateRange] = useReportDateRange();
  const [country, setCountry] = useState<string>();
  const query = useCampaignReport(dateRange, country);

  return (
    <ReportLayout
      channel="campaigns"
      title={
        <Breadcrumb size="xl">
          <BreadcrumbItem to=".." relative="path">
            <Trans message="Campaigns" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            {query.data?.campaign ? (
              query.data.campaign.name
            ) : (
              <Skeleton size="w-144" />
            )}
          </BreadcrumbItem>
        </Breadcrumb>
      }
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <StaticPageTitle>
        <Trans message="Reports - Campaigns" />
      </StaticPageTitle>
      <CampaignReportCharts
        isLoading={query.isLoading}
        data={query.data?.report}
        country={country}
        setCountry={setCountry}
      />
    </ReportLayout>
  );
}
