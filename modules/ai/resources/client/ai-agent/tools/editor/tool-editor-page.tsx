import {
  aiAgentQueries,
  getAiAgentGroupIdFromUrl,
} from '@ai/ai-agent/ai-agent-queries';
import {ApiConnectionStep} from '@ai/ai-agent/tools/editor/api-connection-step/api-connection-step';
import {AttributeMapping} from '@ai/ai-agent/tools/editor/attribute-mapping-step';
import {GeneralStep} from '@ai/ai-agent/tools/editor/general-step';
import {TestResponseStep} from '@ai/ai-agent/tools/editor/test-response-step';
import {ToolEditorStep} from '@ai/ai-agent/tools/editor/tool-editor-step';
import {
  ToolEditorStoreProvider,
  useToolEditorStore,
} from '@ai/ai-agent/tools/editor/tool-editor-store';
import {useTool} from '@ai/ai-agent/tools/editor/use-tool';
import {AdminDocsUrls} from '@app/admin/admin-config';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {DatatablePageHeaderBar} from '@common/datatable/page/datatable-page-with-header-layout';
import {apiClient, queryClient} from '@common/http/query-client';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {partialMatchKey, useMutation} from '@tanstack/react-query';
import {Accordion} from '@ui/accordion/accordion';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {PauseIcon} from '@ui/icons/material/Pause';
import {PlayArrowFilledIcon} from '@ui/icons/play-arrow-filled';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {useMemo} from 'react';
import {useLocation, useParams} from 'react-router';
import {Fragment} from 'react/jsx-runtime';

export function Component() {
  const tool = useTool();
  return (
    <ToolEditorStoreProvider initialTool={tool}>
      <Content />
    </ToolEditorStoreProvider>
  );
}

function Content() {
  const activeStep = useToolEditorStore(s => s.activeStep);
  const setActiveStep = useToolEditorStore(s => s.setActiveStep);
  const expandedValues = useMemo(
    () => (activeStep ? [activeStep] : []),
    [activeStep],
  );

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex-auto overflow-y-auto stable-scrollbar">
        <div className="container mx-auto px-24 py-56">
          <Accordion
            variant="outline"
            mode="single"
            size="lg"
            expandedValues={expandedValues}
            onExpandedChange={values =>
              setActiveStep(values[0] as ToolEditorStep | null)
            }
          >
            <GeneralStep />
            <ApiConnectionStep />
            <TestResponseStep />
            <AttributeMapping />
          </Accordion>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const location = useLocation();
  const tool = useTool();
  const isActive = tool?.active ?? false;
  const allStepsValid = useToolEditorStore(s => {
    const steps = Object.values(ToolEditorStep);
    return steps.every(step => s[step].isValid);
  });

  const changeStatus = useMutation({
    mutationFn: () =>
      apiClient.put(`lc/ai-agent/tools/${tool?.id}`, {
        active: !isActive,
        ...(getAiAgentGroupIdFromUrl()
          ? {groupId: getAiAgentGroupIdFromUrl()}
          : {}),
      }),
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: aiAgentQueries.tools.invalidateKey,
      });
    },
  });

  return (
    <DatatablePageHeaderBar
      showSidebarToggleButton
      rightContent={
        <Fragment>
          <DocsLink size="xs" variant="button" link={AdminDocsUrls.pages.tools}>
            <Trans message="Learn" />
          </DocsLink>
          <Button
            type="button"
            variant="flat"
            color={!isActive ? 'positive' : 'chip'}
            size="xs"
            disabled={!tool || !allStepsValid || changeStatus.isPending}
            onClick={() => changeStatus.mutate()}
            startIcon={!isActive ? <PlayArrowFilledIcon /> : <PauseIcon />}
          >
            {isActive ? (
              <Trans message="Pause" />
            ) : (
              <Trans message="Set live" />
            )}
          </Button>
          {!!tool && (
            <DialogTrigger type="modal">
              <IconButton size="xs" variant="outline">
                <DeleteIcon />
              </IconButton>
              <DeleteToolDialog />
            </DialogTrigger>
          )}
        </Fragment>
      }
    >
      <Breadcrumb size="xl">
        <BreadcrumbItem to={`../tools${location.search}`}>
          <Trans message="Tools" />
        </BreadcrumbItem>
        <BreadcrumbItem>
          {tool?.name ?? <Trans message="Untitled" />}
        </BreadcrumbItem>
      </Breadcrumb>
    </DatatablePageHeaderBar>
  );
}

function DeleteToolDialog() {
  const navigate = useNavigate();
  const {toolId} = useParams();
  const deleteTool = useMutation({
    mutationFn: () =>
      apiClient.delete(
        `lc/ai-agent/tools/${toolId}${
          getAiAgentGroupIdFromUrl()
            ? `?groupId=${getAiAgentGroupIdFromUrl()}`
            : ''
        }`,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: aiAgentQueries.tools.invalidateKey,
        // don't invalidate currently active tool query
        predicate: query =>
          !partialMatchKey(
            query.queryKey,
            aiAgentQueries.tools.get(toolId!, 'editor').queryKey,
          ),
      });
      toast(message('Tool deleted'));
      navigate(`../..${window.location.search}`, {relative: 'path'});
    },
  });

  return (
    <ConfirmationDialog
      isDanger
      title={<Trans message="Delete tool" />}
      body={
        <Trans message="This action is permanent and can't be undone. Configuration relating to this tool will no longer be available." />
      }
      confirm={<Trans message="Delete" />}
      onConfirm={() => deleteTool.mutate()}
      isLoading={deleteTool.isPending}
    />
  );
}
