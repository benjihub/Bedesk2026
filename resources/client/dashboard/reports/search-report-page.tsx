import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ReportLayout} from '@app/dashboard/reports/layout/report-layout';
import {useReportDateRange} from '@app/dashboard/reports/layout/use-date-range';
import {CategoryLink} from '@app/help-center/categories/category-link';
import {
  ReportTable,
  ReportTableCell,
  ReportTableItem,
} from '@common/charts/report-table';
import {ColumnConfig} from '@common/datatable/column-config';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useQuery} from '@tanstack/react-query';
import {LinkStyle} from '@ui/buttons/external-link';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {InfoDialogTrigger} from '@ui/overlays/dialog/info-dialog-trigger/info-dialog-trigger';
import {Skeleton} from '@ui/skeleton/skeleton';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import {ReactNode, useMemo} from 'react';
import {Link, useSearchParams} from 'react-router';

export interface SearchReportItem {
  id: number;
  term: string;
  last_seen: string;
  resulted_in_ticket: number;
  count: string;
  ctr: number;
  category?: {
    id: number;
    name: string;
    image?: string;
  };
}

interface ColumnOptions {
  showCtr: boolean;
  showTicket: boolean;
  description: ReactNode;
}
export const getSearchReportTableColumns = ({
  description,
  showCtr,
  showTicket,
}: ColumnOptions): ColumnConfig<ReportTableItem<SearchReportItem>>[] => {
  const cols: (ColumnConfig<ReportTableItem<SearchReportItem>> | null)[] = [
    {
      key: 'normalized_term',
      allowsSorting: true,
      header: () => (
        <div className="flex items-center gap-4">
          <div>
            <Trans message="Term" />
          </div>
          {!!description && <InfoDialogTrigger body={description} />}
        </div>
      ),
      body: (item, row) =>
        row.isPlaceholder ? (
          <Skeleton size="w-180" />
        ) : (
          <Link
            to={`/hc/search/${item.data.term}`}
            className={LinkStyle}
            target="_blank"
          >
            {item.data.term}
          </Link>
        ),
    },
    {
      key: 'count',
      allowsSorting: true,
      header: () => <Trans message="Count" />,
      width: 'w-144',
      body: (item, row) => {
        return (
          <ReportTableCell
            type="number"
            name="count"
            item={item}
            isPlaceholder={row.isPlaceholder}
          />
        );
      },
    },
    showCtr
      ? {
          key: 'ctr',
          allowsSorting: true,
          header: () => <Trans message="Click-through" />,
          width: 'w-144',
          body: (item, row) => (
            <ReportTableCell
              type="percent"
              name="ctr"
              item={item}
              isPlaceholder={row.isPlaceholder}
            />
          ),
        }
      : null,
    showTicket
      ? {
          key: 'resulted_in_ticket',
          allowsSorting: true,
          header: () => <Trans message="Resulted in ticket" />,
          width: 'w-144',
          body: (item, row) => (
            <ReportTableCell
              type="number"
              name="resulted_in_ticket"
              item={item}
              isPlaceholder={row.isPlaceholder}
            />
          ),
        }
      : null,
    {
      key: 'last_seen',
      allowsSorting: true,
      header: () => <Trans message="Last seen" />,
      width: 'w-144',
      body: (item, row) =>
        row.isPlaceholder ? (
          <Skeleton size="w-80" />
        ) : (
          <FormattedRelativeTime date={item.data.last_seen} />
        ),
    },
    {
      key: 'category_id',
      allowsSorting: true,
      header: () => <Trans message="Category" />,
      width: 'w-288',
      body: (item, row) =>
        row.isPlaceholder ? (
          <Skeleton size="w-120" />
        ) : item.data.category ? (
          <CategoryLink category={item.data.category} target="_blank" />
        ) : null,
    },
  ];

  return cols.filter(Boolean) as ColumnConfig<
    ReportTableItem<SearchReportItem>
  >[];
};

export function PopularSearchReportPage() {
  const columns = useMemo(() => {
    return getSearchReportTableColumns({
      showCtr: true,
      showTicket: true,
      description: (
        <Trans message="Use the popular searches report to see what your customers are looking for, and learn what your customers are most interested in or struggling with the most." />
      ),
    });
  }, []);
  return <SearchReportPage type="popular" columns={columns} />;
}

export function FailedSearchReportPage() {
  const columns = useMemo(() => {
    return getSearchReportTableColumns({
      showCtr: false,
      showTicket: true,
      description: (
        <Trans message="This report shows search terms people use that don't match any articles. Use this metric to improve your help center search and content." />
      ),
    });
  }, []);
  return <SearchReportPage type="failed" columns={columns} />;
}

interface SearchReportPageProps {
  columns: ColumnConfig<ReportTableItem<SearchReportItem>>[];
  type: 'popular' | 'failed';
}
function SearchReportPage({columns, type}: SearchReportPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateRange, setDateRange] = useReportDateRange();
  const query = useQuery(
    helpdeskQueries.reports.get<PaginatedBackendResponse<SearchReportItem>>(
      `reports/search/${type}`,
      dateRange,
      {
        page: searchParams.get('page') || 1,
        perPage: searchParams.get('perPage') || 15,
      },
    ),
  );

  const tabs = (
    <Tabs selectedTab={type === 'popular' ? 0 : 1} className="mb-24">
      <TabList className="mx-24">
        <Tab
          width="min-w-132"
          elementType={Link}
          to="../popular"
          relative="path"
          replace
        >
          <Trans message="Popular searches" />
        </Tab>
        <Tab
          width="min-w-132"
          elementType={Link}
          to="../failed"
          relative="path"
          replace
        >
          <Trans message="Failed searches" />
        </Tab>
      </TabList>
    </Tabs>
  );

  return (
    <ReportLayout
      channel="search"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      tabs={tabs}
      title={<Trans message="Help center search" />}
    >
      <StaticPageTitle>
        <Trans message="Reports - Search" />
      </StaticPageTitle>
      <ReportTable
        columns={columns}
        data={query.data?.pagination.data}
        cellHeight="h-40"
        skeletonCount={8}
      />
      <DataTablePaginationFooter
        query={query}
        onPageChange={page =>
          setSearchParams(prev => {
            prev.set('page', page.toString());
            return prev;
          })
        }
        onPerPageChange={perPage =>
          setSearchParams(prev => {
            prev.set('perPage', perPage.toString());
            return prev;
          })
        }
      />
    </ReportLayout>
  );
}
