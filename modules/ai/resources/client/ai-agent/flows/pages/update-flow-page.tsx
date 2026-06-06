import {
  aiAgentQueries,
  getAiAgentGroupIdFromUrl,
} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentFlow} from '@ai/ai-agent/flows/ai-agent-flow';
import {FlowEditor} from '@ai/ai-agent/flows/flow-editor/flow-editor';
import {
  FlowEditoreStoreProvider,
  useFlowEditorStore,
} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {PreviewSidebar} from '@ai/ai-agent/preview/preview-sidebar';
import {TogglePreviewButton} from '@ai/ai-agent/preview/toggle-preview-button';
import {AdminDocsUrls} from '@app/admin/admin-config';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {SectionHelper} from '@common/ui/other/section-helper';
import {
  useIsMutating,
  useMutation,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Button} from '@ui/buttons/button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {ErrorOutlineIcon} from '@ui/icons/material/ErrorOutline';
import {BlockerDialog} from '@ui/overlays/dialog/blocker-dialog';
import {toast} from '@ui/toast/toast';
import {Fragment} from 'react/jsx-runtime';
import {useLocation} from 'react-router';

export function Component() {
  const {flowId} = useRequiredParams(['flowId']);
  const {data} = useSuspenseQuery(aiAgentQueries.flows.get(flowId));

  return (
    <FlowEditoreStoreProvider
      initialValue={data.flow.config}
      intent={data.flow.intent}
    >
      <NavigationBlocker />
      <div className="dashboard-grid-content dashboard-rounded-panel z-[1] flex h-full flex-col">
        <Header flow={data.flow} />
        <div className="flex-auto p-24">
          <FlowEditor />
        </div>
      </div>
      <PreviewContainer flow={data.flow} />
    </FlowEditoreStoreProvider>
  );
}

function NavigationBlocker() {
  const isDirty = useFlowEditorStore(s => s.isDirty);
  return <BlockerDialog shouldBlock={isDirty} />;
}

function PreviewContainer({flow}: {flow: AiAgentFlow}) {
  const {flowId} = useRequiredParams(['flowId']);
  const {saveChanges, isSaving} = useSaveChanges(flow);
  const isDirty = useFlowEditorStore(s => s.isDirty);
  const previewVisible = useFlowEditorStore(s => s.previewVisible);
  const setPreviewVisible = useFlowEditorStore(s => s.setPreviewVisible);

  if (!previewVisible) return null;

  return (
    <PreviewSidebar
      flowId={flowId}
      onClose={() => setPreviewVisible(false)}
      resetConversationMessage={
        isDirty
          ? resetConversation => (
              <SectionHelper
                className="shadow-md"
                leadingIcon={<ErrorOutlineIcon size="sm" />}
                title={<Trans message="Flow has unsaved changes." />}
                actions={
                  <Button
                    size="xs"
                    color="white"
                    variant="flat"
                    className="min-w-144"
                    disabled={isSaving}
                    onClick={() => {
                      saveChanges.mutate(undefined, {
                        onSuccess: () => resetConversation(),
                      });
                    }}
                  >
                    <Trans message="Save and reset now" />
                  </Button>
                }
                description={
                  <Trans message="Save them and reset conversation to test the current version." />
                }
              />
            )
          : undefined
      }
    />
  );
}

type HeaderProps = {
  flow: AiAgentFlow;
};
function Header({flow}: HeaderProps) {
  const location = useLocation();
  const {saveChanges, isSaving} = useSaveChanges(flow);
  const isDirty = useFlowEditorStore(s => s.isDirty);
  const previewVisible = useFlowEditorStore(s => s.previewVisible);
  const setPreviewVisible = useFlowEditorStore(s => s.setPreviewVisible);

  const actions = (
    <Fragment>
      <DocsLink size="xs" variant="button" link={AdminDocsUrls.pages.flows}>
        <Trans message="Learn" />
      </DocsLink>
      <TogglePreviewButton
        onTogglePreview={() => setPreviewVisible(!previewVisible)}
        previewIsVisible={previewVisible}
      />
      <Button
        variant="flat"
        color="primary"
        className="ml-auto"
        size="xs"
        disabled={isSaving || !isDirty}
        onClick={() => saveChanges.mutate()}
      >
        <Trans message="Save changes" />
      </Button>
    </Fragment>
  );

  return (
    <DatatablePageHeaderBar showSidebarToggleButton rightContent={actions}>
      <Breadcrumb size="xl">
      <BreadcrumbItem to={`../flows${location.search}`}>
        <Trans message="Flows" />
      </BreadcrumbItem>
        <BreadcrumbItem>{flow.name}</BreadcrumbItem>
      </Breadcrumb>
    </DatatablePageHeaderBar>
  );
}

function useSaveChanges(flow: AiAgentFlow) {
  const {flowId} = useRequiredParams(['flowId']);
  const getPayloadForSaving = useFlowEditorStore(s => s.getPayloadForSaving);
  const setIsDirty = useFlowEditorStore(s => s.setIsDirty);
  const mutationKey = ['save-flow-changes'];

  const isSaving = useIsMutating({mutationKey}) > 0;

  const mutation = useMutation({
    mutationKey,
    mutationFn: () =>
      apiClient.put(`lc/ai-agent/flows/${flowId}`, {
        // include name to satisfy backend validation
        name: flow?.name ?? undefined,
        ...getPayloadForSaving(),
        ...(getAiAgentGroupIdFromUrl()
          ? {groupId: getAiAgentGroupIdFromUrl()}
          : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: aiAgentQueries.flows.invalidateKey,
      });
      setIsDirty(false);
      toast(message('Flow updated'));
    },
    onError: err => showHttpErrorToast(err),
  });

  return {
    isSaving,
    saveChanges: mutation,
  };
}
