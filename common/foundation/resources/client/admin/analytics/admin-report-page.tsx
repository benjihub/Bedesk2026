import {AdminReportCardRow} from '@common/admin/analytics/admin-report-card-row';
import {ReportDateSelector} from '@common/admin/analytics/report-date-selector';
import {VisitorsReportCharts} from '@common/admin/analytics/visitors-report-charts';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {DateRangeValue} from '@ui/forms/input-field/date/date-range-picker/date-range-value';
import {DateRangePresets} from '@ui/forms/input-field/date/date-range-picker/dialog/date-range-presets';
import {Trans} from '@ui/i18n/trans';
import {useState} from 'react';
import {StaticPageTitle} from '../../seo/static-page-title';
import {useAdminReport} from './use-admin-report';

export function Component() {
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    // This week
    return DateRangePresets[2].getRangeValue();
  });
  const {isLoading, data} = useAdminReport({dateRange});
  const title = <Trans message="Visitors report" />;

  return (
    <div className="flex h-full flex-col">
      <StaticPageTitle>{title}</StaticPageTitle>
      <DatatablePageHeaderBar
        showSidebarToggleButton
        title={title}
        rightContent={
          <ReportDateSelector value={dateRange} onChange={setDateRange} />
        }
      />
      <div className="chart-grid flex-auto overflow-auto p-12 md:p-24">
        <AdminReportCardRow report={data?.headerReport} />
        <VisitorsReportCharts
          report={data?.visitorsReport}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
