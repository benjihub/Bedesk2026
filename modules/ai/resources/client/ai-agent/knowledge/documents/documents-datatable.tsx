import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentDocument} from '@ai/ai-agent/knowledge/documents/ai-agent-document';
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
import {createdAtFilter} from '@common/datatable/filters/timestamp-filters';
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
import {VisibilityIcon} from '@ui/icons/material/Visibility';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {useState} from 'react';
import {Link} from 'react-router';

const columns: ColumnConfig<AiAgentDocument>[] = [
  {
    key: 'name',
    width: 'flex-3 min-w-200',
    visibleInMode: 'all',
    header: () => <Trans message="Name" />,
    body: document => (
      <Link
        to={
          !document.scan_pending ? `../knowledge/documents/${document.id}` : ''
        }
        className="block hover:underline"
      >
        {document.file_entry.name}
      </Link>
    ),
  },
  {
    key: 'fully_scanned',
    allowsSorting: true,
    width: 'w-144 flex-shrink-0',
    header: () => <Trans message="Status" />,
    body: document => {
      if (document.scan_pending) {
        return (
          <Chip color="danger" size="xs">
            <Trans message="Scan pending" />
          </Chip>
        );
      }
      if (document.scan_failed) {
        return (
          <Chip color="danger" size="xs">
            <Trans message="Scan failed" />
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
    key: 'type',
    allowsSorting: true,
    width: 'w-144 flex-shrink-0',
    header: () => <Trans message="Type" />,
    body: document => document.file_entry.type,
  },
  {
    key: 'created_at',
    allowsSorting: true,
    width: 'w-144',
    header: () => <Trans message="Scan date" />,
    body: document => (
      <time>
        <FormattedDate date={document.created_at} />
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
    body: document => (
      <div className="text-muted">
        <IconButton
          size="md"
          elementType={Link}
          to={`../knowledge/documents/${document.id}`}
          disabled={document.scan_pending || document.scan_failed}
        >
          <VisibilityIcon />
        </IconButton>
      </div>
    ),
  },
];

const filters: BackendFilter[] = [
  {
    key: 'scan_pending',
    label: message('Fully scanned'),
    defaultOperator: FilterOperator.eq,
    control: {
      type: FilterControlType.Select,
      defaultValue: '0',
      options: [
        {value: true, label: 'No', key: '1'},
        {value: false, label: 'Yes', key: '0'},
      ],
    },
  },
  {
    key: 'scan_failed',
    label: message('Scan status'),
    defaultOperator: FilterOperator.eq,
    control: {
      type: FilterControlType.Select,
      defaultValue: '0',
      options: [
        {value: true, label: message('Failed'), key: '0'},
        {value: false, label: message('Succeded'), key: '1'},
      ],
    },
  },
  createdAtFilter({
    label: message('Upload date'),
  }),
];

export function Component() {
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);

  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery(aiAgentQueries.documents.index(searchParams));

  const selectedActions = (
    <DialogTrigger type="modal">
      <Button variant="flat" color="danger">
        <Trans message="Delete" />
      </Button>
      <DeleteDocumentsDialog
        selectedIds={selectedIds}
        onDelete={() => setSelectedIds([])}
      />
    </DialogTrigger>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <StaticPageTitle>
        <Trans message="Documents" />
      </StaticPageTitle>
      <DatatablePageHeaderBar showSidebarToggleButton>
        <Breadcrumb size="xl">
          <BreadcrumbItem to="../knowledge">
            <Trans message="Knowledge" />
          </BreadcrumbItem>
          <BreadcrumbItem to="../knowledge/documents">
            <Trans message="Documents" />
          </BreadcrumbItem>
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
              isFiltering={isFiltering}
              image={onlineArticlesImg}
              title={<Trans message="No documents have been scanned yet" />}
              filteringTitle={<Trans message="No matching documents" />}
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

interface DeleteDocumentsDialogProps {
  selectedIds: (number | string)[];
  onDelete: () => void;
}
function DeleteDocumentsDialog({
  selectedIds,
  onDelete,
}: DeleteDocumentsDialogProps) {
  const {close} = useDialogContext();
  const deleteDocuments = useMutation({
    mutationFn: () =>
      apiClient.delete(
        `lc/ai-agent/documents/${selectedIds.join(',')}${
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
      toast(message('Documents deleted'));
      onDelete();
      close();
    },
    onError: err => showHttpErrorToast(err),
  });
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteDocuments.isPending}
      title={<Trans message="Delete documents" />}
      body={
        <Trans
          message="Are you sure you want to delete selected documents?"
          values={{count: selectedIds.length}}
        />
      }
      confirm={<Trans message="Delete" />}
      onConfirm={() => deleteDocuments.mutate()}
    />
  );
}
