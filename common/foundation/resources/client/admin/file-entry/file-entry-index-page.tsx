import {AdminDocsUrls} from '@app/admin/admin-config';
import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
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
import {FilePreviewDialog} from '@common/uploads/components/file-preview/file-preview-dialog';
import {FileTypeIcon} from '@common/uploads/components/file-type-icon/file-type-icon';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedBytes} from '@ui/i18n/formatted-bytes';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {CloseIcon} from '@ui/icons/material/Close';
import {VisibilityIcon} from '@ui/icons/material/Visibility';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {User} from '@ui/types/user';
import {Fragment, useState} from 'react';
import {ColumnConfig} from '../../datatable/column-config';
import {NameWithAvatar} from '../../datatable/column-templates/name-with-avatar';
import {DataTableEmptyStateMessage} from '../../datatable/page/data-table-emty-state-message';
import {FileEntry} from '../../uploads/file-entry';
import {FILE_ENTRY_INDEX_FILTERS} from './file-entry-index-filters';
import uploadSvg from './upload.svg';

const columnConfig: ColumnConfig<FileEntry>[] = [
  {
    key: 'name',
    allowsSorting: true,
    visibleInMode: 'all',
    width: 'flex-3 min-w-200',
    header: () => <Trans message="Name" />,
    body: entry => (
      <Fragment>
        <div className="overflow-x-hidden overflow-ellipsis">{entry.name}</div>
        <div className="overflow-x-hidden overflow-ellipsis text-xs text-muted">
          {entry.file_name}
        </div>
      </Fragment>
    ),
  },
  {
    key: 'owner_id',
    allowsSorting: true,
    width: 'flex-3 min-w-200',
    header: () => <Trans message="Uploader" />,
    body: entry => {
      const owner =
        entry.users?.find(user => user.owns_entry) ?? entry.users?.[0];
      if (!owner) return null;
      return (
        <NameWithAvatar
          image={(owner as User).image}
          label={(owner as User).name}
          description={owner.email}
        />
      );
    },
  },
  {
    key: 'type',
    width: 'w-100 flex-shrink-0',
    allowsSorting: true,
    header: () => <Trans message="Type" />,
    body: entry => (
      <div className="flex items-center gap-12">
        <FileTypeIcon type={entry.type} className="h-24 w-24 overflow-hidden" />
        <div className="capitalize">{entry.type}</div>
      </div>
    ),
  },
  {
    key: 'public',
    allowsSorting: true,
    width: 'w-60 flex-shrink-0',
    header: () => <Trans message="Public" />,
    body: entry =>
      entry.public ? (
        <CheckIcon className="text-positive icon-md" />
      ) : (
        <CloseIcon className="text-danger icon-md" />
      ),
  },
  {
    key: 'file_size',
    allowsSorting: true,
    maxWidth: 'max-w-100',
    header: () => <Trans message="File size" />,
    body: entry => <FormattedBytes bytes={entry.file_size} />,
  },
  {
    key: 'updated_at',
    allowsSorting: true,
    width: 'w-100',
    header: () => <Trans message="Last updated" />,
    body: entry => <FormattedDate date={entry.updated_at} />,
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    align: 'end',
    width: 'w-42 flex-shrink-0',
    visibleInMode: 'all',
    body: entry => {
      return (
        <DialogTrigger type="modal">
          <IconButton size="md" className="text-muted">
            <VisibilityIcon />
          </IconButton>
          <FilePreviewDialog entries={[entry]} />
        </DialogTrigger>
      );
    },
  },
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

  const query = useDatatableQuery(
    commonAdminQueries.fileEntries.index(searchParams),
  );

  const selectedActions = (
    <DialogTrigger type="modal">
      <Button variant="flat" color="danger">
        <Trans message="Delete" />
      </Button>
      <DeleteEntriesDialog
        selectedIds={selectedIds}
        onDelete={() => setSelectedIds([])}
      />
    </DialogTrigger>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<Trans message="Uploaded files and folders" />}
        showSidebarToggleButton
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.files}
            size="xs"
          />
        }
      />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          selectedItems={selectedIds}
          selectedActions={selectedActions}
          filters={FILE_ENTRY_INDEX_FILTERS}
        />
        <DatatableFilters filters={FILE_ENTRY_INDEX_FILTERS} />
        <DatatablePageScrollContainer>
          <Table
            columns={columnConfig}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection
            selectedRows={selectedIds}
            onSelectionChange={setSelectedIds}
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              image={uploadSvg}
              title={<Trans message="Nothing has been uploaded yet" />}
              filteringTitle={<Trans message="No matching files or folders" />}
            />
          )}
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

interface DeleteEntriesDialogProps {
  selectedIds: (number | string)[];
  onDelete: () => void;
}
function DeleteEntriesDialog({
  selectedIds,
  onDelete,
}: DeleteEntriesDialogProps) {
  const {close} = useDialogContext();
  const deleteSelectedEntries = useMutation({
    mutationFn: () => apiClient.delete(`file-entries/${selectedIds.join(',')}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: commonAdminQueries.fileEntries.invalidateKey,
      });
      toast(message('File entries deleted'));
      onDelete();
      close();
    },
    onError: err => showHttpErrorToast(err),
  });
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteSelectedEntries.isPending}
      title={<Trans message="Delete file entries" />}
      body={
        <Trans
          message="Are you sure you want to delete selected file entries?"
          values={{count: selectedIds.length}}
        />
      }
      confirm={<Trans message="Delete" />}
      onConfirm={() => deleteSelectedEntries.mutate()}
    />
  );
}
