import {AdminDocsUrls} from '@app/admin/admin-config';
import {adminQueries} from '@app/admin/admin-queries';
import {Trigger} from '@app/triggers/trigger';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {ColumnConfig} from '@common/datatable/column-config';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
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
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';
import {EditIcon} from '@ui/icons/material/Edit';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useState} from 'react';
import {Link} from 'react-router';
import softwareEngineerSvg from './software-engineer.svg';

const columns: ColumnConfig<Trigger>[] = [
  {
    key: 'name',
    allowsSorting: true,
    visibleInMode: 'all',
    width: 'flex-3 min-w-200',
    header: () => <Trans message="Name" />,
    body: trigger => trigger.name,
  },
  {
    key: 'times_fired',
    allowsSorting: true,
    header: () => <Trans message="Times used" />,
    body: trigger => <FormattedNumber value={trigger.times_fired} />,
  },
  {
    key: 'updated_at',
    allowsSorting: true,
    width: 'w-100',
    header: () => <Trans message="Last updated" />,
    body: trigger => <FormattedDate date={trigger.updated_at} />,
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    align: 'end',
    width: 'w-42 flex-shrink-0',
    visibleInMode: 'all',
    body: trigger => (
      <IconButton
        size="md"
        className="text-muted"
        elementType={Link}
        to={`/admin/triggers/${trigger.id}/edit`}
      >
        <EditIcon />
      </IconButton>
    ),
  },
];

export function Component() {
  const [selectedRows, setSelectedRows] = useState<(number | string)[]>([]);
  const {searchParams, sortDescriptor, mergeIntoSearchParams, setSearchQuery} =
    useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery({
    ...adminQueries.triggers.index({...searchParams}),
  });

  const selectedActions = (
    <DialogTrigger type="modal">
      <Button variant="flat" color="danger">
        <Trans message="Delete" />
      </Button>
      <DeleteTriggersDialog
        selectedIds={selectedRows}
        onDelete={() => setSelectedRows([])}
      />
    </DialogTrigger>
  );

  const actions = (
    <DataTableAddItemButton elementType={Link} to="/admin/triggers/new">
      <Trans message="Add new trigger" />
    </DataTableAddItemButton>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <StaticPageTitle>
        <Trans message="Triggers" />
      </StaticPageTitle>
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<Trans message="Triggers" />}
        showSidebarToggleButton
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.triggers}
            size="xs"
          />
        }
      />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={actions}
          selectedItems={selectedRows}
          selectedActions={selectedActions}
        />
        <DatatablePageScrollContainer>
          <Table
            columns={columns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            cellHeight="h-64"
          />
          {query.isEmpty ? (
            <DataTableEmptyStateMessage
              image={softwareEngineerSvg}
              title={<Trans message="No triggers have been created yet" />}
              filteringTitle={<Trans message="No matching triggers" />}
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

interface DeleteTriggersDialogProps {
  selectedIds: (number | string)[];
  onDelete: () => void;
}
function DeleteTriggersDialog({
  selectedIds,
  onDelete,
}: DeleteTriggersDialogProps) {
  const {close} = useDialogContext();
  const deleteTriggers = useMutation({
    mutationFn: () => apiClient.delete(`triggers/${selectedIds.join(',')}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminQueries.triggers.invalidateKey,
      });
      onDelete();
      close();
    },
    onError: err => showHttpErrorToast(err),
  });

  return (
    <ConfirmationDialog
      isDanger
      title={<Trans message="Delete triggers" />}
      body={
        <Trans message="Are you sure you want to delete selected triggers?" />
      }
      confirm={<Trans message="Delete" />}
      isLoading={deleteTriggers.isPending}
      onConfirm={() => deleteTriggers.mutate()}
    />
  );
}
