import {ReportDateSelector} from '@common/admin/analytics/report-date-selector';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {CampaignReportCharts} from '@livechat/dashboard/reports/campaign-report-charts';
import {useCampaignReport} from '@livechat/dashboard/reports/use-campaign-report';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {DateRangeValue} from '@ui/forms/input-field/date/date-range-picker/date-range-value';
import {DateRangePresets} from '@ui/forms/input-field/date/date-range-picker/dialog/date-range-presets';
import {Trans} from '@ui/i18n/trans';
import {Skeleton} from '@ui/skeleton/skeleton';
import {useState} from 'react';

export function Component() {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    return DateRangePresets[4].getRangeValue(); // Last 7 days
  });
  const [country, setCountry] = useState<string>();
  const query = useCampaignReport(dateRange, country);
  const data = query.data?.report;

  return (
    <div className="flex h-full flex-col">
      <StaticPageTitle>
        <Trans message="Campaign report" />
      </StaticPageTitle>
      <DatatablePageHeaderBar
        showSidebarToggleButton
        rightContent={
          <ReportDateSelector
            value={dateRange}
            onChange={setDateRange}
            compactOnMobile={false}
          />
        }
      >
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
      </DatatablePageHeaderBar>
      <div className="flex-auto overflow-y-auto p-12 stable-scrollbar md:p-24">
        <CampaignReportCharts
          isLoading={query.isLoading}
          data={data}
          country={country}
          setCountry={setCountry}
        />
      </div>
    </div>
  );
}
