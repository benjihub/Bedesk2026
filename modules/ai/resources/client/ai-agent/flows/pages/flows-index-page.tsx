import {AiAgentPageHeader} from '@ai/ai-agent/ai-agent-page-header';
import {
  aiAgentQueries,
  getAiAgentGroupIdFromUrl,
} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentFlow} from '@ai/ai-agent/flows/ai-agent-flow';
import {PreviewSidebar} from '@ai/ai-agent/preview/preview-sidebar';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {ColumnConfig} from '@common/datatable/column-config';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {
  DatatablePageScrollContainer,
  DatatablePageWithHeaderBody,
  DatatablePageWithHeaderLayout,
} from '@common/datatable/page/datatable-page-with-header-layout';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Table} from '@common/ui/tables/table';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {AccountTreeIcon} from '@ui/icons/material/AccountTree';
import {MoreVertIcon} from '@ui/icons/material/MoreVert';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {Fragment, useState} from 'react';
import {useForm} from 'react-hook-form';
import {Link, useLocation} from 'react-router';

export function Component() {
  const navigate = useNavigate();
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery(aiAgentQueries.flows.index(searchParams));

  const [previewVisible, setPreviewVisible] = useState(false);

  return (
    <Fragment>
      <DatatablePageWithHeaderLayout className="dashboard-grid-content dashboard-rounded-panel">
        <GlobalLoadingProgress query={query} />
        <StaticPageTitle>
          <Trans message="Flows" />
        </StaticPageTitle>
        <AiAgentPageHeader
          previewVisible={previewVisible}
          onTogglePreview={() => setPreviewVisible(!previewVisible)}
        />
        <DatatablePageWithHeaderBody>
          <DataTableHeader
            searchValue={searchParams.query}
            onSearchChange={setSearchQuery}
            actions={<Actions />}
          />
          <DatatablePageScrollContainer>
            {!query.isEmpty || isFiltering ? (
              <Table
                columns={columns}
                data={query.items}
                sortDescriptor={sortDescriptor}
                onSortChange={mergeIntoSearchParams}
                cellHeight="h-64"
                enableSelection={false}
                onAction={flow =>
                  navigate(`../flows/${flow.id}/edit${window.location.search}`)
                }
              />
            ) : null}
            {query.isEmpty ? (
              <DataTableEmptyStateMessage
                isFiltering={isFiltering}
                icon={<AccountTreeIcon />}
                title={<Trans message="No flows yet" />}
                filteringTitle={<Trans message="No matching flows" />}
                description={
                  <Trans message="Get started by adding a new flow." />
                }
              />
            ) : null}
            <DataTablePaginationFooter
              query={query}
              onPageChange={page => mergeIntoSearchParams({page})}
              onPerPageChange={perPage => mergeIntoSearchParams({perPage})}
              hideIfOnlyOnePage
            />
          </DatatablePageScrollContainer>
        </DatatablePageWithHeaderBody>
      </DatatablePageWithHeaderLayout>
      {previewVisible && (
        <PreviewSidebar onClose={() => setPreviewVisible(false)} />
      )}
    </Fragment>
  );
}

const columns: ColumnConfig<AiAgentFlow>[] = [
  {
    key: 'name',
    width: 'flex-3',
    visibleInMode: 'all',
    header: () => <Trans message="Name" />,
    body: flow => flow.name,
  },
  {
    key: 'activation_count',
    allowsSorting: true,
    maxWidth: 'max-w-100',
    header: () => <Trans message="Activations" />,
    body: flow =>
      flow.activation_count ? (
        <FormattedNumber value={flow.activation_count} />
      ) : (
        ''
      ),
  },
  {
    key: 'updated_at',
    allowsSorting: true,
    maxWidth: 'max-w-124',
    header: () => <Trans message="Last updated" />,
    body: flow =>
      flow.updated_at ? <FormattedDate date={flow.updated_at} /> : '',
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    hideHeader: true,
    visibleInMode: 'all',
    align: 'end',
    width: 'w-84 flex-shrink-0',
    body: flow => <FlowOptionsButton flow={flow} />,
  },
];

interface FlowOptionsButtonProps {
  flow: AiAgentFlow;
}
function FlowOptionsButton({flow}: FlowOptionsButtonProps) {
  const location = useLocation();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  return (
    <Fragment>
      <MenuTrigger>
        <IconButton className="text-muted">
          <MoreVertIcon />
        </IconButton>
        <Menu>
          <Item
            value="edit"
            elementType={Link}
            to={`../flows/${flow.id}/edit${location.search}`}
          >
            <Trans message="Edit" />
          </Item>
          <Item value="rename" onSelected={() => setRenameDialogOpen(true)}>
            <Trans message="Rename" />
          </Item>
          <Item value="delete" onSelected={() => setDeleteDialogOpen(true)}>
            <Trans message="Delete" />
          </Item>
        </Menu>
      </MenuTrigger>
      <DialogTrigger
        type="modal"
        isOpen={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
      >
        <RenameFlowDialog flow={flow} />
      </DialogTrigger>
      <DialogTrigger
        type="modal"
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DeleteFlowDialog flow={flow} />
      </DialogTrigger>
    </Fragment>
  );
}

function Actions() {
  return (
    <DialogTrigger type="modal">
      <DataTableAddItemButton>
        <Trans message="Add new flow" />
      </DataTableAddItemButton>
      <CreateFlowDialog />
    </DialogTrigger>
  );
}

function CreateFlowDialog() {
  const navigate = useNavigate();
  const {formId, close} = useDialogContext();
  const form = useForm<{name: string}>();
  const createFlow = useMutation({
    mutationFn: (payload: {name: string}) =>
      apiClient.post<{flow: AiAgentFlow}>('lc/ai-agent/flows', {
        ...payload,
        ...(getAiAgentGroupIdFromUrl()
          ? {groupId: getAiAgentGroupIdFromUrl()}
          : {}),
      }),
    onSuccess: async r => {
      await queryClient.invalidateQueries({
        queryKey: aiAgentQueries.flows.invalidateKey,
      });
      toast(message('Flow created'));
      close();
      navigate(`../flows/${r.data.flow.id}/edit${window.location.search}`, {
        relative: 'path',
      });
    },
    onError: err => showHttpErrorToast(err),
  });

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="New flow" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values => {
            createFlow.mutate(values);
          }}
        >
          <FormTextField
            required
            name="name"
            autoFocus
            label={<Trans message="Name" />}
          />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          type="submit"
          disabled={createFlow.isPending}
          variant="flat"
          color="primary"
          form={formId}
        >
          <Trans message="Create" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

interface RenameFlowDialogProps {
  flow: AiAgentFlow;
}
export function RenameFlowDialog({flow}: RenameFlowDialogProps) {
  const {formId, close} = useDialogContext();
  const form = useForm<Partial<AiAgentFlow>>({
    defaultValues: {
      name: flow.name,
      intent: flow.intent,
    },
  });
  const renameFlow = useMutation({
    mutationFn: (payload: Partial<AiAgentFlow>) =>
      apiClient.put(`lc/ai-agent/flows/${flow.id}`, {
        ...payload,
        ...(getAiAgentGroupIdFromUrl()
          ? {groupId: getAiAgentGroupIdFromUrl()}
          : {}),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: aiAgentQueries.flows.invalidateKey,
      });
      toast(message('Flow updated'));
      close();
    },
    onError: err => showHttpErrorToast(err),
  });

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Update flow" />
      </DialogHeader>
      <DialogBody>
        <Form
          id={formId}
          form={form}
          onSubmit={values => renameFlow.mutate(values)}
        >
          <FormTextField
            required
            name="name"
            autoFocus
            label={<Trans message="Name" />}
            className="mb-24"
          />
          <FormTextField
            name="intent"
            autoFocus
            label={<Trans message="Intent" />}
            inputElementType="textarea"
            rows={2}
            minLength={10}
            maxLength={200}
          />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          type="submit"
          disabled={renameFlow.isPending}
          variant="flat"
          color="primary"
          form={formId}
        >
          <Trans message="Update" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

interface DeleteFlowDialogProps {
  flow: AiAgentFlow;
}
export function DeleteFlowDialog({flow}: DeleteFlowDialogProps) {
  const {close} = useDialogContext();
  const deleteFlow = useMutation({
    mutationFn: () =>
      apiClient.delete(
        `lc/ai-agent/flows/${flow.id}${
          getAiAgentGroupIdFromUrl()
            ? `?groupId=${getAiAgentGroupIdFromUrl()}`
            : ''
        }`,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: aiAgentQueries.flows.invalidateKey,
      });
      toast(message('Flow deleted'));
      close();
    },
    onError: err => showHttpErrorToast(err),
  });
  return (
    <ConfirmationDialog
      isDanger
      isLoading={deleteFlow.isPending}
      title={<Trans message="Delete flow" />}
      body={<Trans message="Are you sure you want to delete this flow?" />}
      confirm={<Trans message="Delete" />}
      onConfirm={() => deleteFlow.mutate()}
    />
  );
}
