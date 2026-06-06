import {AdminDocsUrls} from '@app/admin/admin-config';
import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {useUploadTranslationFile} from '@common/admin/translations/use-upload-translation-file';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
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
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Localization} from '@ui/i18n/localization';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {MoreVertIcon} from '@ui/icons/material/MoreVert';
import {TranslateIcon} from '@ui/icons/material/Translate';
import {Menu, MenuItem, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {openDialog} from '@ui/overlays/store/dialog-store';
import {toast} from '@ui/toast/toast';
import {Tooltip} from '@ui/tooltip/tooltip';
import {downloadFileFromUrl} from '@ui/utils/files/download-file-from-url';
import {FileInputType} from '@ui/utils/files/file-input-config';
import {openUploadWindow} from '@ui/utils/files/open-upload-window';
import {useState} from 'react';
import {Link} from 'react-router';
import {ColumnConfig} from '../../datatable/column-config';
import {DataTableAddItemButton} from '../../datatable/data-table-add-item-button';
import {DataTableEmptyStateMessage} from '../../datatable/page/data-table-emty-state-message';
import aroundTheWorldSvg from './around-the-world.svg';
import {CreateLocationDialog} from './create-localization-dialog';
import {UpdateLocalizationDialog} from './update-localization-dialog';

const columnConfig: ColumnConfig<Localization>[] = [
  {
    key: 'name',
    allowsSorting: true,
    sortingKey: 'name',
    visibleInMode: 'all',
    width: 'flex-3 min-w-200',
    header: () => <Trans message="Name" />,
    body: locale => locale.name,
  },
  {
    key: 'language',
    allowsSorting: true,
    sortingKey: 'language',
    header: () => <Trans message="Language code" />,
    body: locale => locale.language,
  },
  {
    key: 'updatedAt',
    allowsSorting: true,
    width: 'w-100',
    header: () => <Trans message="Last updated" />,
    body: locale => <FormattedDate date={locale.updated_at} />,
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    align: 'end',
    width: 'w-84 flex-shrink-0',
    visibleInMode: 'all',
    body: locale => {
      return (
        <div className="text-muted">
          <Tooltip label={<Trans message="Translate" />}>
            <IconButton
              size="md"
              elementType={Link}
              to={`${locale.id}/translate`}
            >
              <TranslateIcon />
            </IconButton>
          </Tooltip>

          <FileUploadProvider>
            <RowActionsMenuTrigger locale={locale} />
          </FileUploadProvider>
        </div>
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
    commonAdminQueries.localizations.index(searchParams),
  );

  const selectedActions = (
    <DialogTrigger type="modal">
      <Button variant="flat" color="danger">
        <Trans message="Delete" />
      </Button>
      <DeleteLocalizationsDialog
        selectedIds={selectedIds}
        onDelete={() => setSelectedIds([])}
      />
    </DialogTrigger>
  );

  const actions = (
    <DialogTrigger type="modal">
      <DataTableAddItemButton>
        <Trans message="Add new localization" />
      </DataTableAddItemButton>
      <CreateLocationDialog />
    </DialogTrigger>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<Trans message="Localizations" />}
        showSidebarToggleButton
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.translations}
            size="xs"
          />
        }
      />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={actions}
          selectedItems={selectedIds}
          selectedActions={selectedActions}
        />
        <DatatablePageScrollContainer>
          <Table
            columns={columnConfig}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection
            selectedRows={selectedIds}
            onSelectionChange={setSelectedIds}
            cellHeight="h-60"
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              image={aroundTheWorldSvg}
              title={<Trans message="No localizations have been created yet" />}
              filteringTitle={<Trans message="No matching localizations" />}
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

interface RowActionsMenuTriggerProps {
  locale: Localization;
}
function RowActionsMenuTrigger({locale}: RowActionsMenuTriggerProps) {
  const uploadFile = useUploadTranslationFile();
  return (
    <MenuTrigger>
      <IconButton disabled={uploadFile.isPending}>
        <MoreVertIcon />
      </IconButton>
      <Menu>
        <MenuItem
          value="translate"
          elementType={Link}
          to={`${locale.id}/translate`}
        >
          <Trans message="Translate" />
        </MenuItem>
        <MenuItem
          value="rename"
          onSelected={() =>
            openDialog(UpdateLocalizationDialog, {localization: locale})
          }
        >
          <Trans message="Rename" />
        </MenuItem>
        <MenuItem
          value="download"
          onSelected={() =>
            downloadFileFromUrl(`api/v1/localizations/${locale.id}/download`)
          }
        >
          <Trans message="Download" />
        </MenuItem>
        <MenuItem
          value="upload"
          onSelected={async () => {
            const files = await openUploadWindow({
              types: [FileInputType.json],
            });
            if (files.length == 1) {
              uploadFile.mutate({localeId: locale.id, file: files[0]});
            }
          }}
        >
          <Trans message="Upload" />
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
}

interface DeleteLocalizationsDialogProps {
  selectedIds: (number | string)[];
  onDelete: () => void;
}
export function DeleteLocalizationsDialog({
  selectedIds,
  onDelete,
}: DeleteLocalizationsDialogProps) {
  const {close} = useDialogContext();
  const deleteSelectedLocalizations = useMutation({
    mutationFn: () =>
      apiClient.delete(`localizations/${selectedIds.join(',')}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: commonAdminQueries.localizations.invalidateKey,
      });
      toast(message('Localizations deleted'));
      onDelete();
      close();
    },
    onError: err => showHttpErrorToast(err),
  });
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteSelectedLocalizations.isPending}
      title={<Trans message="Delete localizations" />}
      body={
        <Trans
          message="Are you sure you want to delete selected localizations?"
          values={{count: selectedIds.length}}
        />
      }
      confirm={<Trans message="Delete" />}
      onConfirm={() => deleteSelectedLocalizations.mutate()}
    />
  );
}
