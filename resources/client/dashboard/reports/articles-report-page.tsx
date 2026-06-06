import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ReportLayout} from '@app/dashboard/reports/layout/report-layout';
import {useReportDateRange} from '@app/dashboard/reports/layout/use-date-range';
import {getArticleLink} from '@app/help-center/articles/article-link';
import {ArticlePath} from '@app/help-center/articles/article-path';
import {ArticlePathItem} from '@app/help-center/articles/article-path-item';
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
import {Trans} from '@ui/i18n/trans';
import {InfoDialogTrigger} from '@ui/overlays/dialog/info-dialog-trigger/info-dialog-trigger';
import {Skeleton} from '@ui/skeleton/skeleton';
import {Link, useSearchParams} from 'react-router';

interface Report extends PaginatedBackendResponse<ArticleReportItem> {}

interface ArticleReportItem {
  id: number;
  views: number;
  slug: string;
  title: string;
  score: number;
  positive_votes: number;
  negative_votes: number;
  path: ArticlePathItem[];
}

export function Component() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateRange, setDateRange] = useReportDateRange();
  const query = useQuery(
    helpdeskQueries.reports.get<Report>('reports/articles', dateRange, {
      page: searchParams.get('page') || 1,
      perPage: searchParams.get('perPage') || 15,
    }),
  );

  return (
    <ReportLayout
      channel="articles"
      title={<Trans message="Articles" />}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      disableDatePicker
    >
      <StaticPageTitle>
        <Trans message="Reports - Articles" />
      </StaticPageTitle>
      <ReportTable
        columns={columns}
        data={query.data?.pagination.data}
        cellHeight="h-40"
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

const columns: ColumnConfig<ReportTableItem<ArticleReportItem>>[] = [
  {
    key: 'article',
    header: () => (
      <div className="flex items-center gap-4">
        <div>
          <Trans message="Article" />
        </div>
        <InfoDialogTrigger
          body={
            <Trans message="Use the popular articles report to see which articles are most popular, and which articles are the most or least helpful." />
          }
        />
      </div>
    ),
    body: (item, row) =>
      row.isPlaceholder ? (
        <Skeleton size="w-180" />
      ) : (
        <Link
          to={getArticleLink(item.data)}
          className={LinkStyle}
          target="_blank"
        >
          {item.data.title}
        </Link>
      ),
  },
  {
    key: 'views',
    header: () => <Trans message="Views" />,
    width: 'w-144',
    body: (item, row) => {
      return (
        <ReportTableCell
          type="number"
          name="views"
          item={item}
          isPlaceholder={row.isPlaceholder}
        />
      );
    },
  },
  {
    key: 'score',
    header: () => <Trans message="Score" />,
    width: 'w-144',
    body: (item, row) => (
      <ReportTableCell
        type="percent"
        name="score"
        item={item}
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
  {
    key: 'likes',
    header: () => <Trans message="Likes" />,
    width: 'w-144',
    body: (item, row) => (
      <ReportTableCell
        type="number"
        name="positive_votes"
        item={item}
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
  {
    key: 'dislikes',
    header: () => <Trans message="Dislikes" />,
    width: 'w-144',
    body: (item, row) => (
      <ReportTableCell
        type="number"
        name="negative_votes"
        item={item}
        isPlaceholder={row.isPlaceholder}
      />
    ),
  },
  {
    key: 'category',
    header: () => <Trans message="Category" />,
    body: (item, row) =>
      row.isPlaceholder ? (
        <Skeleton size="w-120" />
      ) : (
        <ArticlePath path={item.data.path} />
      ),
  },
];
