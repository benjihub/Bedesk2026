import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import type {AiAgentStatusAgent} from '@ai/ai-agent/ai-agent-queries';
import {PreviewSidebar} from '@ai/ai-agent/preview/preview-sidebar';
import type {PreviewSidebarState} from '@ai/ai-agent/preview/preview-sidebar';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {Button} from '@common/ui/library/buttons/button';
import {Trans} from '@common/ui/library/i18n/trans';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {WifiIcon} from '@ui/icons/material/Wifi';
import {WifiOffIcon} from '@ui/icons/material/WifiOff';
import {useQuery, useSuspenseQuery} from '@tanstack/react-query';
import clsx from 'clsx';
import {Fragment, useCallback, useState} from 'react';
import type {ReactNode} from 'react';
import {useSearchParams} from 'react-router';
import {AiAgentPageHeader} from '../ai-agent-page-header';

export function Component() {
  const [previewVisible, setPreviewVisible] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeGroupId = searchParams.get('groupId');
  const selectedAgentId = searchParams.get('aiAgentId');
  const settingsQuery = useSuspenseQuery(aiAgentQueries.settings.index(activeGroupId));
  const agentsQuery = useSuspenseQuery(aiAgentQueries.status.index(''));
  const groupsQuery = useQuery(helpdeskQueries.groups.normalizedList);
  const agents = agentsQuery.data.agents ?? [];
  const selectedAgent =
    agents.find(agent => `${agent.id}` === selectedAgentId) ?? null;
  const selectedGroup = groupsQuery.data?.groups?.find(
    group => `${group.id}` === activeGroupId,
  );
  const [previewState, setPreviewState] = useState<PreviewSidebarState>({
    conversationId: null,
    isLoading: true,
    src: '',
    activeGroupId: activeGroupId ?? null,
  });
  const handlePreviewStateChange = useCallback((state: PreviewSidebarState) => {
    setPreviewState(current => {
      if (
        current.conversationId === state.conversationId &&
        current.isLoading === state.isLoading &&
        current.src === state.src &&
        current.activeGroupId === state.activeGroupId
      ) {
        return current;
      }
      return state;
    });
  }, []);
  const settings = settingsQuery.data.settings;
  const selectAgent = (agent: AiAgentStatusAgent) => {
    const next = new URLSearchParams(searchParams);
    next.set('aiAgentId', `${agent.id}`);
    if (agent.group_id == null) {
      next.delete('groupId');
    } else {
      next.set('groupId', `${agent.group_id}`);
    }
    setSearchParams(next);
    setPreviewVisible(true);
  };

  return (
    <Fragment>
      <div className="dashboard-grid-content dashboard-rounded-panel flex h-full flex-col">
        <StaticPageTitle>
          <Trans message="Chat test" />
        </StaticPageTitle>
        <AiAgentPageHeader
          previewVisible={previewVisible}
          onTogglePreview={() => setPreviewVisible(!previewVisible)}
          showGroupScopeSelect={false}
        />
        <div className="flex-auto overflow-y-auto p-24">
          <div className="grid max-w-5xl gap-18">
            <section className="rounded-panel border bg px-24 py-20">
              <div className="mb-16 flex flex-wrap items-start justify-between gap-12">
                <div>
                  <div className="text-base font-medium">
                    <Trans message="AI behavior testing" />
                  </div>
                  <p className="mt-4 max-w-2xl text-sm text-muted">
                    <Trans message="Test the selected group configuration in preview mode before customers reach the live inbox." />
                  </p>
                </div>
                <Button
                  variant={previewVisible ? 'outline' : 'flat'}
                  color={previewVisible ? undefined : 'primary'}
                  size="xs"
                  onClick={() => setPreviewVisible(!previewVisible)}
                >
                  {previewVisible ? (
                    <Trans message="Hide preview" />
                  ) : (
                    <Trans message="Open preview" />
                  )}
                </Button>
              </div>
              <div className="grid gap-12 md:grid-cols-3">
                <ContextMetric
                  label={<Trans message="Selected agent" />}
                  value={selectedAgent?.name ?? <Trans message="Choose an agent" />}
                />
                <ContextMetric
                  label={<Trans message="Group" />}
                  value={
                    selectedGroup?.name ??
                    (activeGroupId ? `Group #${activeGroupId}` : 'Global')
                  }
                />
                <ContextMetric
                  label={<Trans message="AI status" />}
                  value={settings.enabled ? 'Enabled' : 'Paused'}
                />
                <ContextMetric
                  label={<Trans message="Greeting" />}
                  value={
                    settings.greetingType === 'flow'
                      ? 'Flow'
                      : 'Basic greeting'
                  }
                />
              </div>
            </section>
            <section className="rounded-panel border bg px-24 py-20">
              <div className="mb-16">
                <div className="text-base font-medium">
                  <Trans message="Choose an AI agent" />
                </div>
                <p className="mt-4 max-w-2xl text-sm text-muted">
                  <Trans message="Click an agent to load its group configuration into the preview test." />
                </p>
              </div>
              {agents.length ? (
                <div className="grid gap-12 md:grid-cols-2">
                  {agents.map(agent => (
                    <AgentPickerCard
                      key={agent.id}
                      agent={agent}
                      groupName={
                        agent.group_id == null
                          ? 'Global'
                          : groupsQuery.data?.groups?.find(
                              group => group.id === agent.group_id,
                            )?.name ?? `Group #${agent.group_id}`
                      }
                      isSelected={selectedAgent?.id === agent.id}
                      onSelect={() => selectAgent(agent)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-panel border border-dashed px-16 py-14 text-sm text-muted">
                  <Trans message="No AI agents have been created yet." />
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
      {previewVisible && (
        <PreviewSidebar
          onPreviewStateChange={handlePreviewStateChange}
          resetConversationMessage={resetConversation => (
            <div className="flex items-center justify-between gap-12 rounded-panel border bg px-12 py-10 shadow">
              <span className="text-xs text-muted">
                <Trans message="Start this preview from a clean conversation." />
              </span>
              <Button variant="outline" size="xs" onClick={resetConversation}>
                <Trans message="Reset test" />
              </Button>
            </div>
          )}
          onClose={() => setPreviewVisible(false)}
        />
      )}
    </Fragment>
  );
}

interface ContextMetricProps {
  label: ReactNode;
  value: ReactNode;
}

function ContextMetric({label, value}: ContextMetricProps) {
  return (
    <div className="rounded-panel border bg px-14 py-12">
      <div className="mb-4 text-xs uppercase text-muted">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

interface AgentPickerCardProps {
  agent: AiAgentStatusAgent;
  groupName: string;
  isSelected: boolean;
  onSelect: () => void;
}

function AgentPickerCard({
  agent,
  groupName,
  isSelected,
  onSelect,
}: AgentPickerCardProps) {
  const isConnected = agent.status === 'connected';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'rounded-panel border bg px-16 py-14 text-left transition',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'hover:border-primary/50 hover:bg-hover',
      )}
    >
      <div className="flex items-start justify-between gap-12">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-main">
            {agent.name}
          </div>
          <div className="mt-4 text-xs text-muted">{groupName}</div>
        </div>
        <span
          className={clsx(
            'inline-flex items-center gap-6 rounded-full px-8 py-4 text-xs font-semibold',
            isConnected
              ? 'bg-positive/10 text-positive'
              : 'bg-muted/10 text-muted',
          )}
        >
          {isConnected ? <WifiIcon size="xs" /> : <WifiOffIcon size="xs" />}
          <Trans message={isConnected ? 'Connected' : 'Disconnected'} />
        </span>
      </div>
      <div className="mt-12 text-xs text-muted">
        <Trans message={agent.status_detail ?? 'No activity yet'} />
      </div>
    </button>
  );
}
