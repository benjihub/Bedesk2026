import {AiAgentPageHeader} from '@ai/ai-agent/ai-agent-page-header';
import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {PreviewSidebar} from '@ai/ai-agent/preview/preview-sidebar';
import {AiAgentTool} from '@ai/ai-agent/tools/ai-agent-tool';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {ColumnConfig} from '@common/datatable/column-config';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {
  DatatablePageScrollContainer,
  DatatablePageWithHeaderBody,
  DatatablePageWithHeaderLayout,
} from '@common/datatable/page/datatable-page-with-header-layout';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Table} from '@common/ui/tables/table';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {PowerIcon} from '@ui/icons/material/Power';
import {Fragment, useState} from 'react';
import {Link, useLocation} from 'react-router';

export function Component() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery(aiAgentQueries.tools.index(searchParams));

  const [previewVisible, setPreviewVisible] = useState(false);

  return (
    <Fragment>
      <DatatablePageWithHeaderLayout className="dashboard-grid-content dashboard-rounded-panel">
        <GlobalLoadingProgress query={query} />
        <StaticPageTitle>
          <Trans message="Tools" />
        </StaticPageTitle>
        <AiAgentPageHeader
          previewVisible={previewVisible}
          onTogglePreview={() => setPreviewVisible(!previewVisible)}
        />
        <DatatablePageWithHeaderBody>
          <DataTableHeader
            searchValue={searchParams.query}
            onSearchChange={setSearchQuery}
            actions={
              <DataTableAddItemButton
                elementType={Link}
                to={`new${location.search}`}
              >
                <Trans message="Add new tool" />
              </DataTableAddItemButton>
            }
          />
          <DatatablePageScrollContainer>
            {!query.isEmpty || isFiltering ? (
              <Table
                columns={columns}
                data={query.items}
                sortDescriptor={sortDescriptor}
                onSortChange={mergeIntoSearchParams}
                cellHeight="h-64"
                enableSelection={false}
                onAction={tool =>
                  navigate(`../tools/${tool.id}/edit${location.search}`)
                }
              />
            ) : null}
            {query.isEmpty ? (
              <DataTableEmptyStateMessage
                className="mt-44"
                isFiltering={isFiltering}
                icon={<PowerIcon />}
                title={<Trans message="No tools yet" />}
                description={
                  <Trans message="Get started by adding a new tool." />
                }
                filteringTitle={<Trans message="No matching tools" />}
              />
            ) : null}
            <DataTablePaginationFooter
              hideIfOnlyOnePage
              query={query}
              onPageChange={page => mergeIntoSearchParams({page})}
              onPerPageChange={perPage => mergeIntoSearchParams({perPage})}
            />
          </DatatablePageScrollContainer>
        </DatatablePageWithHeaderBody>
      </DatatablePageWithHeaderLayout>
      {previewVisible && (
        <PreviewSidebar onClose={() => setPreviewVisible(false)} />
      )}
    </Fragment>
  );
}

export const columns: ColumnConfig<AiAgentTool>[] = [
  {
    key: 'name',
    width: 'flex-3',
    visibleInMode: 'all',
    header: () => <Trans message="Name" />,
    body: tool => tool.name,
  },
  {
    key: 'allow_direct_use',
    allowsSorting: true,
    header: () => <Trans message="Used directly by AI agent" />,
    body: tool =>
      tool.allow_direct_use ? <CheckIcon className="text-muted" /> : '-',
  },
  {
    key: 'activation_count',
    allowsSorting: true,
    header: () => <Trans message="Times used" />,
    body: tool =>
      tool.activation_count ? (
        <FormattedNumber value={tool.activation_count} />
      ) : (
        '-'
      ),
  },
  {
    key: 'status',
    header: () => <Trans message="Status" />,
    visibleInMode: 'all',
    width: 'w-124',
    body: tool => (
      <Chip
        color={tool.active ? 'positive' : 'chip'}
        size="sm"
        className="min-w-64 text-center"
      >
        {tool.active ? (
          <Trans message="Active" />
        ) : (
          <Trans message="Inactive" />
        )}
      </Chip>
    ),
  },
  {
    key: 'updated_at',
    allowsSorting: true,
    maxWidth: 'max-w-124',
    header: () => <Trans message="Last updated" />,
    body: tool =>
      tool.updated_at ? <FormattedDate date={tool.updated_at} /> : '',
  },
];
