import {AdminDocsUrls} from '@app/admin/admin-config';
import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {CustomPageDatatableColumns} from '@common/admin/custom-pages/custom-page-datatable-columns';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {SiteConfigContext} from '@common/core/settings/site-config-context';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
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
import {Table} from '@common/ui/tables/table';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {Fragment, useContext, useMemo, useState} from 'react';
import {Link} from 'react-router';
import articlesSvg from './articles.svg';
import {CustomPageDatatableFilters} from './custom-page-datatable-filters';

export function Component() {
  const config = useContext(SiteConfigContext);
  const [selectedRows, setSelectedRows] = useState<(number | string)[]>([]);
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const filters = useMemo(() => {
    return CustomPageDatatableFilters(config);
  }, [config]);

  const query = useDatatableQuery({
    ...commonAdminQueries.customPages.index({...searchParams}),
  });

  const selectedActions = (
    <DialogTrigger type="modal">
      <Button variant="flat" color="danger">
        <Trans message="Delete" />
      </Button>
      <DeleteCustomPagesDialog
        selectedIds={selectedRows}
        onDelete={() => setSelectedRows([])}
      />
    </DialogTrigger>
  );

  const actions = (
    <Fragment>
      <DataTableAddItemButton elementType={Link} to="new">
        <Trans message="New page" />
      </DataTableAddItemButton>
    </Fragment>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<Trans message="Custom pages" />}
        showSidebarToggleButton
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.customPages}
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
          filters={filters}
        />
        <DatatableFilters filters={filters} />
        <DatatablePageScrollContainer>
          <Table
            columns={CustomPageDatatableColumns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              image={articlesSvg}
              title={<Trans message="No pages have been created yet" />}
              filteringTitle={<Trans message="No matching pages" />}
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

interface DeleteCustomPagesDialogProps {
  selectedIds: (number | string)[];
  onDelete: () => void;
}
function DeleteCustomPagesDialog({
  selectedIds,
  onDelete,
}: DeleteCustomPagesDialogProps) {
  const {close} = useDialogContext();
  const deletePages = useMutation({
    mutationFn: () =>
      apiClient
        .delete(`custom-pages/${selectedIds.join(',')}`)
        .then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commonAdminQueries.customPages.invalidateKey,
      });
      toast(message('Pages deleted'));
      onDelete();
      close();
    },
    onError: err => showHttpErrorToast(err),
  });

  return (
    <ConfirmationDialog
      isLoading={deletePages.isPending}
      onConfirm={() => deletePages.mutate()}
      title={<Trans message="Delete pages" />}
      body={<Trans message="Are you sure you want to delete selected pages?" />}
      confirm={<Trans message="Delete" />}
    />
  );
}
