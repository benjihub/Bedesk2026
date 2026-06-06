import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {IngestWebsiteDialog} from '@ai/ai-agent/knowledge/websites/ingest-website-dialog';
import {AiAgentWebsite} from '@ai/ai-agent/knowledge/websites/requests/ai-agent-website';
import {useSyncWebsiteContent} from '@ai/ai-agent/knowledge/websites/requests/use-sync-website-content';
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
import {AddIcon} from '@ui/icons/material/Add';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {SyncIcon} from '@ui/icons/material/Sync';
import {VisibilityIcon} from '@ui/icons/material/Visibility';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {Link, useNavigate} from 'react-router';

const columns: ColumnConfig<AiAgentWebsite>[] = [
  {
    key: 'name',
    width: 'flex-3 min-w-200',
    visibleInMode: 'all',
    header: () => <Trans message="Website" />,
    body: website => (
      <div>
        <Link to={`${website.id}/pages`} className="block hover:underline">
          {website.title}
        </Link>
        <a
          href={website.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted hover:underline"
        >
          {website.url}
        </a>
      </div>
    ),
  },
  {
    key: 'fully_scanned',
    allowsSorting: true,
    width: 'w-144 flex-shrink-0',
    header: () => <Trans message="Status" />,
    body: website => {
      if (website.scan_pending) {
        return (
          <Chip color="danger" size="xs">
            <Trans message="Scan pending" />
          </Chip>
        );
      }
      return (
        <Chip color="positive" size="xs">
          <Trans message="Scanned" />
        </Chip>
      );
    },
  },
  {
    key: 'updatedAt',
    allowsSorting: true,
    width: 'w-96',
    header: () => <Trans message="Last updated" />,
    body: website => (
      <time>
        <FormattedDate date={website.updated_at} />
      </time>
    ),
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    width: 'w-128 flex-shrink-0',
    hideHeader: true,
    align: 'end',
    visibleInMode: 'all',
    body: website => (
      <div className="text-muted">
        <IconButton
          elementType={Link}
          to={`${website.id}/pages`}
          disabled={website.scan_pending}
        >
          <VisibilityIcon />
        </IconButton>
        <ResyncButton websiteId={website.id} />
        <DialogTrigger type="modal">
          <IconButton>
            <DeleteIcon />
          </IconButton>
          <DeleteWebsiteDialog websiteId={website.id} />
        </DialogTrigger>
      </div>
    ),
  },
];

export const filters: BackendFilter[] = [
  {
    key: 'scan_pending',
    label: message('Scan pending'),
    description: message('Whether website is queued for scanning'),
    defaultOperator: FilterOperator.eq,
    control: {
      type: FilterControlType.BooleanToggle,
      defaultValue: true,
    },
  },
  createdAtFilter({
    label: message('First scanned'),
    description: message('Date website was first scanned'),
  }),
  updatedAtFilter({
    description: message('Date website was last updated'),
  }),
];

export function Component() {
  const navigate = useNavigate();
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery(aiAgentQueries.websites.index(searchParams));

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <StaticPageTitle>
        <Trans message="Websites" />
      </StaticPageTitle>
      <DatatablePageHeaderBar showSidebarToggleButton>
        <Breadcrumb size="xl">
          <BreadcrumbItem to="../knowledge">
            <Trans message="Knowledge" />
          </BreadcrumbItem>
          <BreadcrumbItem to="../knowledge/websites">
            <Trans message="Websites" />
          </BreadcrumbItem>
        </Breadcrumb>
      </DatatablePageHeaderBar>
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          filters={filters}
          actions={
            <DialogTrigger type="modal">
              <Button startIcon={<AddIcon />} variant="flat" color="primary">
                <Trans message="Add website" />
              </Button>
              <IngestWebsiteDialog />
            </DialogTrigger>
          }
        />
        <DatatableFilters filters={filters} />
        <DatatablePageScrollContainer>
          <Table
            columns={columns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection={false}
            onAction={website => navigate(`${website.id}/pages`)}
            cellHeight="h-64"
          />
          {query.isEmpty ? (
            <DataTableEmptyStateMessage
              image={onlineArticlesImg}
              isFiltering={isFiltering}
              title={<Trans message="No websites have been scanned yet" />}
              filteringTitle={<Trans message="No matching websites" />}
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

interface ResyncButtonProps {
  websiteId: string | number;
}
function ResyncButton({websiteId}: ResyncButtonProps) {
  const resync = useSyncWebsiteContent();
  return (
    <IconButton
      disabled={resync.isPending}
      onClick={() => {
        resync.mutate({
          websiteId,
        });
      }}
    >
      <SyncIcon />
    </IconButton>
  );
}

interface DeleteWebsiteDialogProps {
  websiteId: string | number;
}
function DeleteWebsiteDialog({websiteId}: DeleteWebsiteDialogProps) {
  const {close} = useDialogContext();
  const deleteWebsite = useMutation({
    mutationFn: () => apiClient.delete(`lc/ai-agent/websites/${websiteId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: aiAgentQueries.knowledge.invalidateKey,
      });
      toast(message('Website deleted'));
      close();
    },
    onError: err => showHttpErrorToast(err),
  });
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteWebsite.isPending}
      title={<Trans message="Delete website" />}
      body={<Trans message="Are you sure you want to delete this website?" />}
      confirm={<Trans message="Delete" />}
      onConfirm={() => deleteWebsite.mutate()}
    />
  );
}
