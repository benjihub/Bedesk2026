import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ReportLayout} from '@app/dashboard/reports/layout/report-layout';
import {useReportDateRange} from '@app/dashboard/reports/layout/use-date-range';
import {
  ChartGridReportTable,
  ReportTable,
  ReportTableCell,
  ReportTableItem,
} from '@common/charts/report-table';
import {ColumnConfig} from '@common/datatable/column-config';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {CampaignReportCharts} from '@livechat/dashboard/reports/campaign-report-charts';
import {CampaignReport} from '@livechat/dashboard/reports/use-campaign-report';
import {useQuery} from '@tanstack/react-query';
import {Trans} from '@ui/i18n/trans';
import {Skeleton} from '@ui/skeleton/skeleton';
import {useState} from 'react';

interface ReportItem {
  id: number;
  name: Campaign['name'];
  impression_count: Campaign['impression_count'];
  interaction_count: Campaign['interaction_count'];
}

interface AllCampaignsReport {
  overview: CampaignReport;
  campaigns: ReportItem[];
}

export const columns: ColumnConfig<ReportTableItem<ReportItem>>[] = [
  {
    key: 'name',
    visibleInMode: 'all',
    header: () => <Trans message="Name" />,
    body: (campaign, row) =>
      row.isPlaceholder ? (
        <Skeleton size="w-100" />
      ) : (
        <span className="text-primary hover:underline">
          {campaign.data.name}
        </span>
      ),
  },
  {
    key: 'impression_count',
    header: () => <Trans message="Displayed" />,
    body: (campaign, row) => (
      <ReportTableCell
        item={campaign}
        name="impression_count"
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
  {
    key: 'interaction_count',
    header: () => <Trans message="Interactions" />,
    body: (campaign, row) => (
      <ReportTableCell
        item={campaign}
        name="interaction_count"
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
  {
    key: 'conversion',
    header: () => <Trans message="Conversion" />,
    body: (campaign, row) =>
      row.isPlaceholder ? (
        <Skeleton size="w-60" />
      ) : campaign.data.interaction_count && campaign.data.impression_count ? (
        `${(
          (campaign.data.interaction_count / campaign.data.impression_count) *
          100
        ).toFixed(2)}%`
      ) : (
        '-'
      ),
  },
];

export function Component() {
  const navigate = useNavigate();
  const [country, setCountry] = useState<string>();
  const [dateRange, setDateRange] = useReportDateRange();
  const query = useQuery(
    helpdeskQueries.reports.get<AllCampaignsReport>(
      'lc/reports/campaigns',
      dateRange,
      {
        country: country || '',
      },
    ),
  );
  return (
    <ReportLayout
      channel="campaigns"
      title={<Trans message="Campaigns" />}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <StaticPageTitle>
        <Trans message="Reports - Campaigns" />
      </StaticPageTitle>
      <CampaignReportCharts
        isLoading={query.isLoading}
        data={query.data?.overview}
        country={country}
        setCountry={setCountry}
      >
        <ChartGridReportTable label={<Trans message="Campaign breakdown" />}>
          <ReportTable
            columns={columns}
            data={query.data?.campaigns}
            onAction={item => {
              navigate(`${item.data.id}`);
            }}
          />
        </ChartGridReportTable>
      </CampaignReportCharts>
    </ReportLayout>
  );
}
