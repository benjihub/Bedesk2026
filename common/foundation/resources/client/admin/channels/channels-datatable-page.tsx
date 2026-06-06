import {appQueries} from '@app/app-queries';
import {ChannelsDatatableColumns} from '@common/admin/channels/channels-datatable-columns';
import {ChannelsDocsLink} from '@common/admin/channels/channels-docs-link';
import {useApplyChannelPreset} from '@common/admin/channels/requests/use-apply-channel-preset';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
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
import {Item} from '@ui/forms/listbox/item';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {openDialog} from '@ui/overlays/store/dialog-store';
import {toast} from '@ui/toast/toast';
import {Fragment, useState} from 'react';
import {Link} from 'react-router';
import playlist from './playlist.svg';

interface ChannelPresetConfig {
  preset: string;
  name: string;
  description: string;
}

export function Component() {
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery(appQueries.channels.index(searchParams));

  const selectedActions = (
    <DialogTrigger type="modal">
      <Button variant="flat" color="danger">
        <Trans message="Delete" />
      </Button>
      <DeleteChannelsDialog
        selectedIds={selectedIds}
        onDelete={() => setSelectedIds([])}
      />
    </DialogTrigger>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <StaticPageTitle>
        <Trans message="Channels" />
      </StaticPageTitle>
      <DatatablePageHeaderBar
        title={<Trans message="Channels" />}
        rightContent={<ChannelsDocsLink variant="button" />}
        showSidebarToggleButton
      />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={<Actions presets={query.data?.presets} />}
          selectedItems={selectedIds}
          selectedActions={selectedActions}
        />
        <DatatablePageScrollContainer>
          <Table
            cellHeight="h-52"
            columns={ChannelsDatatableColumns}
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
              image={playlist}
              title={<Trans message="No channels have been created yet" />}
              filteringTitle={<Trans message="No matching channels" />}
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

interface ActionsProps {
  presets: ChannelPresetConfig[] | undefined;
}
function Actions({presets}: ActionsProps) {
  return (
    <Fragment>
      <MenuTrigger
        onItemSelected={preset => openDialog(ApplyPresetDialog, {preset})}
      >
        <Button
          variant="outline"
          color="primary"
          size="sm"
          endIcon={<KeyboardArrowDownIcon />}
          disabled={!presets?.length}
        >
          <Trans message="Apply preset" />
        </Button>
        <Menu>
          {presets?.map(preset => (
            <Item
              key={preset.preset}
              value={preset.preset}
              description={<Trans message={preset.description} />}
            >
              <Trans message={preset.name} />
            </Item>
          ))}
        </Menu>
      </MenuTrigger>
      <DataTableAddItemButton elementType={Link} to="new">
        <Trans message="Add new channel" />
      </DataTableAddItemButton>
    </Fragment>
  );
}

interface ApplyPresetDialogProps {
  preset: string;
}
function ApplyPresetDialog({preset}: ApplyPresetDialogProps) {
  const {close} = useDialogContext();
  const resetChannels = useApplyChannelPreset();
  return (
    <ConfirmationDialog
      isLoading={resetChannels.isPending}
      onConfirm={() => {
        resetChannels.mutate({preset}, {onSuccess: () => close()});
      }}
      isDanger
      title={<Trans message="Apply preset" />}
      body={
        <Trans message="Are you sure you want to apply this channel preset? This will delete all current channels and leave only channels from the selected preset." />
      }
      confirm={<Trans message="Apply" />}
    />
  );
}

interface DeleteChannelsDialogProps {
  selectedIds: (number | string)[];
  onDelete: () => void;
}
function DeleteChannelsDialog({
  selectedIds,
  onDelete,
}: DeleteChannelsDialogProps) {
  const {close} = useDialogContext();
  const deleteSelectedChannels = useMutation({
    mutationFn: () => apiClient.delete(`channels/${selectedIds.join(',')}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['channels'],
      });
      toast(message('Channels deleted'));
      onDelete();
      close();
    },
    onError: err => showHttpErrorToast(err),
  });
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteSelectedChannels.isPending}
      title={<Trans message="Delete channels" />}
      body={
        <Trans
          message="Are you sure you want to delete selected channels?"
          values={{count: selectedIds.length}}
        />
      }
      confirm={<Trans message="Delete" />}
      onConfirm={() => deleteSelectedChannels.mutate()}
    />
  );
}
