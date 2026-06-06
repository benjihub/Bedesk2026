import {AdminDocsUrls} from '@app/admin/admin-config';
import {DashboardIcon, DashboardIconName} from '@app/dashboard/dashboard-icons';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useUpdateView} from '@app/dashboard/views/use-update-view';
import {View} from '@app/dashboard/views/view';
import searchImage from '@app/help-center/search/search.svg';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {ColumnConfig} from '@common/datatable/column-config';
import {NameWithAvatar} from '@common/datatable/column-templates/name-with-avatar';
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
import {Table} from '@common/ui/tables/table';
import {TableContext} from '@common/ui/tables/table-context';
import {RowElementProps} from '@common/ui/tables/table-row';
import {mergeProps} from '@react-aria/utils';
import {useMutation} from '@tanstack/react-query';
import {IconButton} from '@ui/buttons/icon-button';
import {Item as MenuItem} from '@ui/forms/listbox/item';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {DragHandleIcon} from '@ui/icons/material/DragHandle';
import {MoreVertIcon} from '@ui/icons/material/MoreVert';
import {DragPreview} from '@ui/interactions/dnd/drag-preview';
import {
  DropPosition,
  useSortable,
} from '@ui/interactions/dnd/sortable/use-sortable';
import {DragPreviewRenderer} from '@ui/interactions/dnd/use-draggable';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {NormalizedModel} from '@ui/types/normalized-model';
import {moveItemInNewArray} from '@ui/utils/array/move-item-in-new-array';
import {useIsTouchDevice} from '@ui/utils/hooks/is-touch-device';
import clsx from 'clsx';
import React, {Fragment, useContext, useRef, useState} from 'react';
import {Link, useNavigate} from 'react-router';

const columns: ColumnConfig<View>[] = [
  {
    key: 'dragHandle',
    width: 'w-42 flex-shrink-0',
    header: () => <Trans message="Drag handle" />,
    hideHeader: true,
    body: () => (
      <DragHandleIcon className="cursor-pointer text-muted hover:text" />
    ),
  },
  {
    key: 'name',
    width: 'flex-3 min-w-200',
    visibleInMode: 'all',
    header: () => <Trans message="Name" />,
    body: view => (
      <div className="flex items-center gap-12">
        <DashboardIcon name={view.icon as DashboardIconName} size="sm" />
        {view.name}
      </div>
    ),
  },
  {
    key: 'owner_id',
    allowsSorting: true,
    header: () => <Trans message="User" />,
    body: view =>
      view.user && (
        <NameWithAvatar
          image={view.user.image}
          label={view.user.name}
          description={view.user.email}
          avatarCircle
        />
      ),
  },
  {
    key: 'access',
    allowsSorting: true,
    header: () => <Trans message="Available for" />,
    body: view => {
      switch (view.access) {
        case 'anyone':
          return <Trans message="Any agent" />;
        case 'owner':
          return <Trans message="View owner" />;
        case 'group':
          return (
            <Trans
              message="Agents in :name"
              values={{name: view.group?.name}}
            />
          );
      }
    },
  },
  {
    key: 'pinned',
    allowsSorting: true,
    header: () => <Trans message="Pinned" />,
    width: 'w-96',
    body: view => view.pinned && <CheckIcon className="text-muted" />,
  },
  {
    key: 'active',
    allowsSorting: true,
    header: () => <Trans message="Active" />,
    width: 'w-96',
    body: view => view.active && <CheckIcon className="text-muted" />,
  },
  {
    key: 'updatedAt',
    allowsSorting: true,
    width: 'w-124',
    header: () => <Trans message="Last updated" />,
    body: view => (
      <time>
        <FormattedDate date={view.updated_at} />
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
    body: view => <ActionsButton view={view} />,
  },
];

export function Component() {
  const navigate = useNavigate();

  const {searchParams, sortDescriptor, mergeIntoSearchParams, setSearchQuery} =
    useDatatableSearchParams(validateDatatableSearch);
  const isFiltering = !!(searchParams.query || searchParams.filters);

  const query = useDatatableQuery(helpdeskQueries.views.index(searchParams));

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar
        title={<Trans message="Views" />}
        showSidebarToggleButton
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.views}
            size="xs"
          />
        }
      />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={
            <DataTableAddItemButton elementType={Link} to="new">
              <Trans message="Add view" />
            </DataTableAddItemButton>
          }
        />
        <DatatablePageScrollContainer>
          <Table
            columns={columns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection={false}
            cellHeight="h-64"
            renderRowAs={TableRow}
            onAction={(row: View) => navigate(`${row.id}/update`)}
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              image={searchImage}
              title={<Trans message="No views have been created yet" />}
              filteringTitle={<Trans message="No matching views" />}
            />
          )}
          <DataTablePaginationFooter
            hideIfOnlyOnePage
            query={query}
            onPageChange={page => mergeIntoSearchParams({page})}
            onPerPageChange={perPage => mergeIntoSearchParams({perPage})}
          />
        </DatatablePageScrollContainer>
      </DatatablePageWithHeaderBody>
    </DatatablePageWithHeaderLayout>
  );
}

function TableRow({
  item,
  children,
  className,
  ...domProps
}: RowElementProps<NormalizedModel>) {
  const isTouchDevice = useIsTouchDevice();
  const {data} = useContext(TableContext);
  const domRef = useRef<HTMLTableRowElement>(null);
  const reorderViews = useReorderViews();
  const previewRef = useRef<DragPreviewRenderer>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition>(null);

  const {sortableProps} = useSortable({
    ref: domRef,
    disabled: isTouchDevice ?? false,
    item,
    items: data,
    type: 'viewsTableItem',
    preview: previewRef,
    strategy: 'line',
    onDropPositionChange: position => {
      setDropPosition(position);
    },
    onSortEnd: (oldIndex, newIndex) => {
      reorderViews.mutate({
        viewIds: moveItemInNewArray(
          data.map(item => item.id),
          oldIndex,
          newIndex,
        ),
      });
    },
  });

  return (
    <div
      className={clsx(
        className,
        dropPosition === 'before' && 'sort-preview-before',
        dropPosition === 'after' && 'sort-preview-after',
      )}
      ref={domRef}
      {...mergeProps(sortableProps, domProps)}
    >
      {children}
      {!item.isPlaceholder && <RowDragPreview item={item} ref={previewRef} />}
    </div>
  );
}

interface RowDragPreviewProps {
  item: NormalizedModel;
}
const RowDragPreview = React.forwardRef<
  DragPreviewRenderer,
  RowDragPreviewProps
>(({item}, ref) => {
  return (
    <DragPreview ref={ref}>
      {() => (
        <div className="rounded bg-chip p-8 text-base shadow">{item.name}</div>
      )}
    </DragPreview>
  );
});

export function useReorderViews() {
  return useMutation({
    mutationFn: (payload: {viewIds: (number | string)[]}) =>
      apiClient.post(`helpdesk/views/reorder`, payload).then(r => r.data),
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: helpdeskQueries.views.invalidateKey,
      });
    },
    onError: err => showHttpErrorToast(err),
  });
}

interface ActionsButtonProps {
  view: View;
}
export function ActionsButton({view}: ActionsButtonProps) {
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);
  const updateView = useUpdateView(view.id);

  const activateView = () =>
    updateView.mutate(
      {active: true},
      {onSuccess: () => toast(message('Activated view'))},
    );

  const deactivateView = () =>
    updateView.mutate(
      {active: false},
      {onSuccess: () => toast(message('Deactivated view'))},
    );

  return (
    <Fragment>
      {deleteDialogIsOpen && (
        <DialogTrigger
          type="modal"
          isOpen={deleteDialogIsOpen}
          onOpenChange={setDeleteDialogIsOpen}
        >
          <DeleteViewDialog view={view} />
        </DialogTrigger>
      )}
      <MenuTrigger>
        <IconButton className="text-muted" disabled={updateView.isPending}>
          <MoreVertIcon />
        </IconButton>
        <Menu>
          <MenuItem value="edit" elementType={Link} to={`${view.id}/update`}>
            <Trans message="Edit" />
          </MenuItem>
          {!view.active && (
            <MenuItem value="activate" onSelected={() => activateView()}>
              <Trans message="Activate" />
            </MenuItem>
          )}
          {view.active && (
            <MenuItem
              value="deactivate"
              onSelected={() => deactivateView()}
              isDisabled={view.internal}
            >
              <Trans message="Deactivate" />
            </MenuItem>
          )}
          <MenuItem
            value="delete"
            className="text-danger"
            onSelected={() => setDeleteDialogIsOpen(true)}
            isDisabled={view.internal}
          >
            <Trans message="Delete" />
          </MenuItem>
        </Menu>
      </MenuTrigger>
    </Fragment>
  );
}

interface DeleteViewDialogProps {
  view: View;
}
export function DeleteViewDialog({view}: DeleteViewDialogProps) {
  const deleteView = useMutation({
    mutationFn: () => apiClient.delete(`helpdesk/views/${view.id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.views.invalidateKey,
      }),
    onError: err => showHttpErrorToast(err),
  });
  const {close} = useDialogContext();
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteView.isPending}
      title={<Trans message="Delete view" />}
      body={<Trans message="Are you sure you want to delete this view?" />}
      confirm={<Trans message="Delete" />}
      onConfirm={() => {
        deleteView.mutate(undefined, {onSuccess: () => close()});
      }}
    />
  );
}
