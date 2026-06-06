import {adminQueries} from '@app/admin/admin-queries';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
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
import {Table} from '@common/ui/tables/table';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {EditIcon} from '@ui/icons/material/Edit';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useContext, useMemo, useState} from 'react';
import {SiteConfigContext} from '../../core/settings/site-config-context';
import {ColumnConfig} from '../../datatable/column-config';
import {DataTableAddItemButton} from '../../datatable/data-table-add-item-button';
import {DataTableEmptyStateMessage} from '../../datatable/page/data-table-emty-state-message';
import {Tag} from '../../tags/tag';
import {CreateTagDialog} from './create-tag-dialog';
import softwareEngineerSvg from './software-engineer.svg';
import {TagIndexPageFilters} from './tag-index-page-filters';
import {UpdateTagDialog} from './update-tag-dialog';

const columnConfig: ColumnConfig<Tag>[] = [
  {
    key: 'name',
    allowsSorting: true,
    visibleInMode: 'all',
    width: 'flex-3 min-w-200',
    header: () => <Trans message="Name" />,
    body: tag => tag.name,
  },
  {
    key: 'type',
    allowsSorting: true,
    header: () => <Trans message="Type" />,
    body: tag => tag.type,
  },
  {
    key: 'display_name',
    allowsSorting: true,
    header: () => <Trans message="Display name" />,
    body: tag => tag.display_name,
  },
  {
    key: 'updated_at',
    allowsSorting: true,
    width: 'w-100',
    header: () => <Trans message="Last updated" />,
    body: tag => <FormattedDate date={tag.updated_at} />,
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    align: 'end',
    width: 'w-42 flex-shrink-0',
    visibleInMode: 'all',
    body: tag => {
      return (
        <DialogTrigger type="modal">
          <IconButton size="md" className="text-muted">
            <EditIcon />
          </IconButton>
          <UpdateTagDialog tag={tag} />
        </DialogTrigger>
      );
    },
  },
];

export function Component() {
  const [selectedRows, setSelectedRows] = useState<(number | string)[]>([]);
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery({
    ...adminQueries.tags.index({...searchParams}),
  });

  const {tags} = useContext(SiteConfigContext);
  const filters = useMemo(() => {
    return TagIndexPageFilters(tags.types);
  }, [tags.types]);

  const selectedActions = (
    <DialogTrigger type="modal">
      <Button variant="flat" color="danger">
        <Trans message="Delete" />
      </Button>
      <DeleteTagsDialog
        selectedIds={selectedRows}
        onDelete={() => setSelectedRows([])}
      />
    </DialogTrigger>
  );

  const actions = (
    <DialogTrigger type="modal">
      <DataTableAddItemButton>
        <Trans message="Add new tag" />
      </DataTableAddItemButton>
      <CreateTagDialog />
    </DialogTrigger>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<Trans message="Tags" />}
        showSidebarToggleButton
      />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={actions}
          selectedItems={selectedRows}
          selectedActions={selectedActions}
          filters={filters}
        />
        <DatatableFilters filters={filters} />
        <DatatablePageScrollContainer>
          <Table
            columns={columnConfig}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />
          {query.isEmpty ? (
            <DataTableEmptyStateMessage
              image={softwareEngineerSvg}
              isFiltering={isFiltering}
              title={<Trans message="No tags have been created yet" />}
              filteringTitle={<Trans message="No matching tags" />}
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

interface DeleteTagsDialogProps {
  selectedIds: (number | string)[];
  onDelete: () => void;
}
function DeleteTagsDialog({selectedIds, onDelete}: DeleteTagsDialogProps) {
  const {close} = useDialogContext();
  const deleteTags = useMutation({
    mutationFn: () => {
      return apiClient.delete(`tags/${selectedIds.join(',')}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminQueries.tags.invalidateKey,
      });
      onDelete();
      close();
    },
    onError: err => showHttpErrorToast(err),
  });

  return (
    <ConfirmationDialog
      isDanger
      title={<Trans message="Delete tags" />}
      body={<Trans message="Are you sure you want to delete selected tags?" />}
      confirm={<Trans message="Delete" />}
      isLoading={deleteTags.isPending}
      onConfirm={() => {
        deleteTags.mutate();
      }}
    />
  );
}
