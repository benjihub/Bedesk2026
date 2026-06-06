import {ArticleDatatableColumns} from '@app/help-center/articles/article-datatable/article-datatable-columns';
import {ArticleDatatableFilters} from '@app/help-center/articles/article-datatable/article-datatable-filters';
import {
  batchActions,
  usePerformBatchAction,
} from '@app/help-center/articles/article-datatable/use-perform-batch-action';
import {HcArticleEditorBreadcrumb} from '@app/help-center/articles/article-editor/hc-article-editor-breadcrumb';
import {useIngestArticles} from '@app/help-center/articles/requests/use-ingest-articles';
import {useUningestArticles} from '@app/help-center/articles/requests/use-uningest-articles';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {VisibleToField} from '@app/help-center/visible-to-field';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
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
import {Form} from '@ui/forms/form';
import {Item} from '@ui/forms/listbox/item';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {CloseIcon} from '@ui/icons/material/Close';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useSettings} from '@ui/settings/use-settings';
import {toast} from '@ui/toast/toast';
import {Fragment, useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Link} from 'react-router';
import onlineArticlesImg from './online-articles.svg';

export function Component() {
  const {aiAgent} = useSettings();
  const columns = useMemo(() => {
    return ArticleDatatableColumns.filter(
      c => c.key !== 'used_by_ai_agent' || aiAgent?.enabled,
    );
  }, [aiAgent]);

  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery(
    helpCenterQueries.articles.index(searchParams),
  );

  const breadCrumb = <HcArticleEditorBreadcrumb />;

  const selectedActions = (
    <SelectedActions
      selectedIds={selectedIds}
      onActionDone={() => setSelectedIds([])}
    />
  );

  const actions = (
    <Fragment>
      <DataTableAddItemButton elementType={Link} to="new">
        <Trans message="Add article" />
      </DataTableAddItemButton>
    </Fragment>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <DatatablePageHeaderBar title={breadCrumb} showSidebarToggleButton />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={actions}
          selectedItems={selectedIds}
          selectedActions={selectedActions}
          filters={ArticleDatatableFilters}
        />
        <DatatableFilters filters={ArticleDatatableFilters} />
        <DatatablePageScrollContainer>
          <Table
            cellHeight="h-60"
            columns={columns}
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
              image={onlineArticlesImg}
              title={<Trans message="No articles have been created yet" />}
              filteringTitle={<Trans message="No matching articles" />}
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

type SelectedActionsProps = {
  selectedIds: (number | string)[];
  onActionDone: () => void;
};
function SelectedActions({selectedIds, onActionDone}: SelectedActionsProps) {
  const {aiAgent} = useSettings();
  return (
    <div className="flex gap-8">
      <ChangeArticleStateButton
        selectedIds={selectedIds}
        onSuccess={() => onActionDone()}
      />
      <ChangeVisibilityButton
        selectedIds={selectedIds}
        onSuccess={() => onActionDone()}
      />
      {aiAgent?.enabled && (
        <ChangeAiAgentStateButton
          selectedIds={selectedIds}
          onSuccess={() => onActionDone()}
        />
      )}
      <DialogTrigger type="modal">
        <Button variant="flat" color="danger">
          <Trans message="Delete" />
        </Button>
        <DeleteArticlesDialog
          selectedIds={selectedIds}
          onDelete={() => onActionDone()}
        />
      </DialogTrigger>
    </div>
  );
}

type ChangeArticleStateButtonProps = {
  selectedIds: (number | string)[];
  onSuccess: () => void;
};
function ChangeArticleStateButton({
  selectedIds,
  onSuccess,
}: ChangeArticleStateButtonProps) {
  const performBatchAction = usePerformBatchAction();
  return (
    <MenuTrigger
      onItemSelected={value => {
        performBatchAction.mutate(
          batchActions.changeArticleStatus(
            selectedIds,
            value as 'draft' | 'published',
          ),
          {onSuccess: () => onSuccess()},
        );
      }}
    >
      <Button
        variant="outline"
        endIcon={<KeyboardArrowDownIcon />}
        disabled={performBatchAction.isPending}
      >
        <Trans message="Change status" />
      </Button>
      <Menu>
        <Item value="published">
          <Trans message="Published" />
        </Item>
        <Item value="draft">
          <Trans message="Draft" />
        </Item>
      </Menu>
    </MenuTrigger>
  );
}

function ChangeVisibilityButton({
  selectedIds,
  onSuccess,
}: ChangeArticleStateButtonProps) {
  return (
    <DialogTrigger type="modal">
      <Button variant="outline" endIcon={<KeyboardArrowDownIcon />}>
        <Trans message="Change visibility" />
      </Button>
      <ChangeVisibilityDialog
        selectedIds={selectedIds}
        onSuccess={() => onSuccess()}
      />
    </DialogTrigger>
  );
}

function ChangeVisibilityDialog({
  selectedIds,
  onSuccess,
}: ChangeArticleStateButtonProps) {
  const {close, formId} = useDialogContext();
  const performBatchAction = usePerformBatchAction();
  const form = useForm<{visible_to_role: string}>({
    defaultValues: {
      visible_to_role: '',
    },
  });
  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Change visibility" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={data =>
            performBatchAction.mutate(
              batchActions.changeVisibility(selectedIds, data.visible_to_role),
              {
                onSuccess: () => {
                  close();
                  onSuccess();
                },
              },
            )
          }
        >
          <VisibleToField
            className="mb-24"
            description={
              <Trans message="Control who can see this article in help center" />
            }
          />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          form={formId}
          type="submit"
          variant="flat"
          color="primary"
          disabled={performBatchAction.isPending}
        >
          <Trans message="Change" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function ChangeAiAgentStateButton({
  selectedIds,
  onSuccess,
}: ChangeArticleStateButtonProps) {
  const ingestArticles = useIngestArticles();
  const uningestArticles = useUningestArticles();
  return (
    <MenuTrigger>
      <Button
        variant="outline"
        endIcon={<KeyboardArrowDownIcon />}
        disabled={ingestArticles.isPending || uningestArticles.isPending}
      >
        <Trans message="Change AI agent state" />
      </Button>
      <Menu>
        <Item
          value="enable"
          startIcon={<CheckIcon size="sm" />}
          onSelected={() =>
            ingestArticles.mutate(
              {articleIds: selectedIds},
              {onSuccess: () => onSuccess()},
            )
          }
        >
          <Trans message="Enable for AI agent" />
        </Item>
        <Item
          value="disable"
          startIcon={<CloseIcon size="sm" />}
          onSelected={() =>
            uningestArticles.mutate(
              {articleIds: selectedIds},
              {onSuccess: () => onSuccess()},
            )
          }
        >
          <Trans message="Disable for AI agent" />
        </Item>
      </Menu>
    </MenuTrigger>
  );
}

interface DeleteArticlesDialogProps {
  selectedIds: (number | string)[];
  onDelete: () => void;
}
export function DeleteArticlesDialog({
  selectedIds,
  onDelete,
}: DeleteArticlesDialogProps) {
  const {close} = useDialogContext();
  const deleteSelectedArticles = useMutation({
    mutationFn: () => apiClient.delete(`hc/articles/${selectedIds.join(',')}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpCenterQueries.articles.invalidateKey,
      });
      toast(message('Articles deleted'));
      onDelete();
      close();
    },
    onError: err => showHttpErrorToast(err),
  });
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteSelectedArticles.isPending}
      title={<Trans message="Delete articles" />}
      body={
        <Trans
          message="Are you sure you want to delete selected articles?"
          values={{count: selectedIds.length}}
        />
      }
      confirm={<Trans message="Delete" />}
      onConfirm={() => deleteSelectedArticles.mutate()}
    />
  );
}
