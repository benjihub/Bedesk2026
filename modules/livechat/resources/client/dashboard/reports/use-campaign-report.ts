import {
  DatasetItem,
  LocationDatasetItem,
  ReportMetric,
} from '@common/admin/analytics/report-metric';
import {apiClient} from '@common/http/query-client';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {Campaign} from '@livechat/dashboard/campaigns/campaign';
import {keepPreviousData, useQuery} from '@tanstack/react-query';
import {DateRangeValue} from '@ui/forms/input-field/date/date-range-picker/date-range-value';

type NewType = LocationDatasetItem;

export interface CampaignReport {
  impressions: ReportMetric<DatasetItem>;
  devices: ReportMetric<DatasetItem>;
  browsers: ReportMetric<DatasetItem>;
  platforms: ReportMetric<DatasetItem>;
  countries: ReportMetric<LocationDatasetItem>;
  cities: ReportMetric<NewType>;
}

export function useCampaignReport(range: DateRangeValue, country?: string) {
  const {campaignId} = useRequiredParams(['campaignId']);
  const params = {
    startDate: range.start.toAbsoluteString(),
    endDate: range.end.toAbsoluteString(),
    timezone: range.start.timeZone,
    country,
  };
  return useQuery({
    queryKey: ['campaigns', `${campaignId}`, 'report', params],
    placeholderData: keepPreviousData,
    queryFn: () => {
      return apiClient
        .get<{report: CampaignReport; campaign: Campaign}>(
          `lc/campaigns/${campaignId}/report`,
          {
            params,
          },
        )
        .then(r => r.data);
    },
  });
}
