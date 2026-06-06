import {TeammatePerformanceTableItem} from '@app/dashboard/reports/team/teammate-performance-table';
import {TagsReportDatasetItem} from '@app/dashboard/reports/types/tags-report-dataset-item';
import {DatasetItem, ReportMetric} from '@common/admin/analytics/report-metric';
import {BusiestTimeOfDayMetric} from '@common/charts/busiest-time-of-day-chart';

export interface ConversationsReport {
  newConversations: ReportMetric<
    DatasetItem,
    {
      total: number;
      solvedTotal: number;
      solvedOnFirstReplyPercentage: number;
    }
  >;
  firstReplyTimes: ReportMetric<
    {
      label: string;
      value: number;
      percentage: number;
      granularity: 'minutes' | 'hours';
    },
    {average: number}
  >;
  busiestTimeOfDay: BusiestTimeOfDayMetric;
  tags: ReportMetric<TagsReportDatasetItem>;
  taggedConversations: ReportMetric<
    DatasetItem,
    {total: number; taggedTotal: number}
  >;
  agents: ReportMetric<
    TeammatePerformanceTableItem,
    {
      totalAgentReplies: number;
      avgResponseTime: number;
      satisfaction: number | null;
      totalConversations: number;
    }
  >;
}
