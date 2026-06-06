import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentWebpage} from '@ai/ai-agent/knowledge/websites/requests/ai-agent-website';
import onlineArticlesImg from '@app/help-center/articles/article-datatable/online-articles.svg';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {ColumnConfig} from '@common/datatable/column-config';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {
  BackendFilter,
  FilterControlType,
  FilterOperator,
} from '@common/datatable/filters/backend-filter';
import {
  createdAtFilter,
  updatedAtFilter,
} from '@common/datatable/filters/timestamp-filters';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {DatatableFilters} from '@common/datatable/page/datatable-filters';
import {
  DatatablePageHeaderBar,
  DatatablePageScrollContainer,
  DatatablePageWithHeaderBody,
  DatatablePageWithHeaderLayout,
} from '@common/datatable/page/datatable-page-with-header-layout';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {Table} from '@common/ui/tables/table';
import {useMutation} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {VisibilityIcon} from '@ui/icons/material/Visibility';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {useState} from 'react';
import {Link} from 'react-router';

const columns: ColumnConfig<AiAgentWebpage>[] = [
  {
    key: 'name',
    width: 'flex-3 min-w-200',
    visibleInMode: 'all',
    header: () => <Trans message="Page" />,
    body: page => (
      <div>
        <Link
          to={page.fully_scanned ? `${page.id}` : ''}
          className="block hover:underline"
        >
          {page.title}
        </Link>
        <a
          href={page.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted hover:underline"
        >
          {page.url}
        </a>
      </div>
    ),
  },
  {
    key: 'fully_scanned',
    allowsSorting: true,
    width: 'w-100 flex-shrink-0',
    header: () => <Trans message="Status" />,
    body: page => {
      if (!page.fully_scanned) {
        return (
          <Chip color="danger" size="xs">
            <Trans message="Scan pending" />
          </Chip>
        );
      }
      if (page.scan_pending) {
        return (
          <Chip color="primary" size="xs">
            <Trans message="Sync pending" />
          </Chip>
        );
      }
      return (
        <Chip color="positive" size="xs">
          <Trans message="Synced" />
        </Chip>
      );
    },
  },
  {
    key: 'updatedAt',
    allowsSorting: true,
    width: 'w-96',
    header: () => <Trans message="Last updated" />,
    body: page => (
      <time>
        <FormattedDate date={page.updated_at} />
      </time>
    ),
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    width: 'w-42 flex-shrink-0',
    hideHeader: true,
    align: 'end',
    visibleInMode: 'all',
    body: page => (
      <div className="text-muted">
        <IconButton
          size="md"
          elementType={Link}
          to={`${page.id}`}
          disabled={!page.fully_scanned}
        >
          <VisibilityIcon />
        </IconButton>
      </div>
    ),
  },
];

const filters: BackendFilter[] = [
  {
    key: 'fully_scanned',
    label: message('Fully scanned'),
    description: message('Whether webpage was fully scanned at least once'),
    defaultOperator: FilterOperator.eq,
    control: {
      type: FilterControlType.BooleanToggle,
      defaultValue: true,
    },
  },
  {
    key: 'scan_pending',
    label: message('Scan pending'),
    description: message('Whether webpage is queued for scanning'),
    defaultOperator: FilterOperator.eq,
    control: {
      type: FilterControlType.BooleanToggle,
      defaultValue: true,
    },
  },
  createdAtFilter({
    label: message('First scanned'),
    description: message('Date webpage was first scanned'),
  }),
  updatedAtFilter({
    description: message('Date webpage was last updated'),
  }),
];

export function Component() {
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const {websiteId} = useRequiredParams(['websiteId']);

  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery(
    aiAgentQueries.webpages.index(websiteId, searchParams),
  );

  const selectedActions = (
    <DialogTrigger type="modal">
      <Button variant="flat" color="danger">
        <Trans message="Delete" />
      </Button>
      <DeleteWebpagesDialog
        selectedIds={selectedIds}
        onDelete={() => setSelectedIds([])}
      />
    </DialogTrigger>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <StaticPageTitle>
        <Trans message="Webpages" />
      </StaticPageTitle>
      <DatatablePageHeaderBar showSidebarToggleButton>
        <Breadcrumb size="xl">
          <BreadcrumbItem to="../knowledge">
            <Trans message="Knowledge" />
          </BreadcrumbItem>
          <BreadcrumbItem to="../knowledge/websites">
            <Trans message="Websites" />
          </BreadcrumbItem>
          <BreadcrumbItem>{query.data?.website.title}</BreadcrumbItem>
        </Breadcrumb>
      </DatatablePageHeaderBar>
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          filters={filters}
          selectedItems={selectedIds}
          selectedActions={selectedActions}
        />
        <DatatableFilters filters={filters} />
        <DatatablePageScrollContainer>
          <Table
            columns={columns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            cellHeight="h-64"
            selectedRows={selectedIds}
            onSelectionChange={setSelectedIds}
          />
          {query.isEmpty ? (
            <DataTableEmptyStateMessage
              image={onlineArticlesImg}
              isFiltering={isFiltering}
              title={<Trans message="No webpages have been scanned yet" />}
              filteringTitle={<Trans message="No matching webpages" />}
            />
          ) : null}
          <DataTablePaginationFooter
            query={query}
            onPageChange={page => mergeIntoSearchParams({page})}
            onPerPageChange={perPage => mergeIntoSearchParams({perPage})}
          />
        </DatatablePageScrollContainer>
      </DatatablePageWithHeaderBody>
    </DatatablePageWithHeaderLayout>
  );
}

interface DeleteWebpagesDialogProps {
  selectedIds: (number | string)[];
  onDelete: () => void;
}
export function DeleteWebpagesDialog({
  selectedIds,
  onDelete,
}: DeleteWebpagesDialogProps) {
  const {websiteId} = useRequiredParams(['websiteId']);
  const {close} = useDialogContext();
  const deleteSelectedPages = useMutation({
    mutationFn: () =>
      apiClient.delete(
        `lc/ai-agent/websites/${websiteId}/webpages/${selectedIds.join(',')}${
          typeof window !== 'undefined'
            ? `?groupId=${
                new URLSearchParams(window.location.search).get('groupId') ?? ''
              }`
            : ''
        }`,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: aiAgentQueries.knowledge.invalidateKey,
      });
      toast(message('Webpages deleted'));
      onDelete();
      close();
    },
    onError: err => showHttpErrorToast(err),
  });
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteSelectedPages.isPending}
      title={<Trans message="Delete webpages" />}
      body={
        <Trans
          message="Are you sure you want to delete selected webpages?"
          values={{count: selectedIds.length}}
        />
      }
      confirm={<Trans message="Delete" />}
      onConfirm={() => deleteSelectedPages.mutate()}
    />
  );
}
