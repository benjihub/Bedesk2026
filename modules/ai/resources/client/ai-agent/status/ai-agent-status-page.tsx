import {aiAgentQueries, AiAgentStatusAgent} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentPageHeader} from '@ai/ai-agent/ai-agent-page-header';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {Button} from '@common/ui/library/buttons/button';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {ArrowForwardIcon} from '@ui/icons/material/ArrowForward';
import {BoltIcon} from '@ui/icons/material/Bolt';
import {CloudSyncIcon} from '@ui/icons/material/CloudSync';
import {RefreshIcon} from '@ui/icons/material/Refresh';
import {SyncProblemIcon} from '@ui/icons/material/SyncProblem';
import {TimerIcon} from '@ui/icons/material/Timer';
import {WifiIcon} from '@ui/icons/material/Wifi';
import {WifiOffIcon} from '@ui/icons/material/WifiOff';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import clsx from 'clsx';
import {Fragment, ReactNode} from 'react';
import {Link} from 'react-router';

const REFRESH_INTERVAL_MS = 15_000;

export function Component() {
  const query = useSuspenseQuery({
    ...aiAgentQueries.status.index(),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
    staleTime: 5_000,
  });

  return (
    <Fragment>
      <div className="dashboard-grid-content dashboard-rounded-panel flex h-full flex-col">
        <AiAgentPageHeader />
        <div className="flex-auto overflow-y-auto p-24">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-24">
            <HeroCard
              refreshedAt={query.data?.refreshed_at}
              onRefresh={() => query.refetch()}
            />
            <SummaryGrid summary={query.data?.summary} />
            <div className="grid gap-16 xl:grid-cols-2 2xl:grid-cols-3">
              {query.data?.agents?.length ? (
                query.data.agents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onCompleted={() => query.refetch()}
                  />
                ))
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

function HeroCard({
  onRefresh,
  refreshedAt,
}: {
  onRefresh: () => void;
  refreshedAt?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-panel border border-divider bg-gradient-to-br from-surface via-surface to-surface-2 shadow-sm">
      <div className="flex flex-col gap-16 p-24 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-8 inline-flex items-center gap-8 rounded-full border border-primary/20 bg-primary/10 px-10 py-4 text-xs font-semibold text-primary">
            <CloudSyncIcon size="xs" />
            <Trans message="Live status" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-main">
            <Trans message="AI Agent Status" />
          </h1>
          <p className="mt-8 max-w-2xl text-sm text-muted">
            <Trans message="Monitor connected AI agents, inspect request health, and reconnect anything that goes offline." />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-12">
          <Button
            variant="outline"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            <Trans message="Refresh" />
          </Button>
          <Button
            elementType={Link}
            to="/dashboard/reports/ai-agent"
            variant="flat"
            color="primary"
            startIcon={<ArrowForwardIcon />}
          >
            <Trans message="View analytics" />
          </Button>
        </div>
      </div>
      <div className="border-t border-divider px-24 py-14 text-xs text-muted">
        {refreshedAt ? (
          <Trans
            message="Last refreshed :date"
            values={{
              date: <FormattedDate date={refreshedAt} preset="timestamp" />,
            }}
          />
        ) : (
          <Trans message="Refreshing automatically every 15 seconds." />
        )}
      </div>
    </div>
  );
}

function SummaryGrid({
  summary,
}: {
  summary?: {
    connected_agents: number;
    disconnected_agents: number;
    error_agents: number;
    total_requests: number;
    successful_responses: number;
    uptime_percent: number | null;
    average_response_time_ms: number | null;
    token_usage: number;
  };
}) {
  const cards = [
    {
      label: 'Connected',
      value: summary?.connected_agents ?? 0,
      icon: <WifiIcon />,
      color: 'text-positive',
    },
    {
      label: 'Disconnected',
      value: summary?.disconnected_agents ?? 0,
      icon: <WifiOffIcon />,
      color: 'text-muted',
    },
    {
      label: 'Error',
      value: summary?.error_agents ?? 0,
      icon: <SyncProblemIcon />,
      color: 'text-danger',
    },
    {
      label: 'Total requests',
      value: summary?.total_requests ?? 0,
      icon: <BoltIcon />,
      color: 'text-primary',
    },
    {
      label: 'Successful responses',
      value: summary?.successful_responses ?? 0,
      icon: <CloudSyncIcon />,
      color: 'text-positive',
    },
    {
      label: 'Average response time',
      value: formatMs(summary?.average_response_time_ms),
      icon: <TimerIcon />,
      color: 'text-warning',
    },
    {
      label: 'Uptime',
      value:
        summary?.uptime_percent == null ? '—' : `${summary.uptime_percent}%`,
      icon: <WifiIcon />,
      color: 'text-primary',
    },
    {
      label: 'Token usage',
      value: formatNumber(summary?.token_usage ?? 0),
      icon: <BoltIcon />,
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid gap-16 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(card => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-panel border border-divider bg-alt/60 p-18 shadow-sm transition-transform duration-150 hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-12">
        <div
          className={clsx(
            'inline-flex h-36 w-36 items-center justify-center rounded-full bg-white/70',
            color,
          )}
        >
          {icon}
        </div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted">
          <Trans message={label} />
        </div>
      </div>
      <div className="mt-14 text-3xl font-semibold tracking-tight text-main">
        {value}
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  onCompleted,
}: {
  agent: AiAgentStatusAgent;
  onCompleted: () => void;
}) {
  const reconnect = useMutation({
    mutationFn: () =>
      apiClient.put(`lc/ai-agent/agents/${agent.id}`, {
        groupId: agent.group_id ?? undefined,
        name: agent.name,
        image: agent.image,
        enabled: true,
        personality: agent.personality,
        greeting_type: agent.greeting_type,
        initial_flow_id: agent.initial_flow_id,
        basic_greeting_message: agent.basic_greeting_message,
        basic_greeting_flow_ids: agent.basic_greeting_flow_ids,
        transfer_instruction: agent.transfer_instruction,
        cant_assist_instruction: agent.cant_assist_instruction,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: aiAgentQueries.status.invalidateKey});
      await queryClient.invalidateQueries({queryKey: aiAgentQueries.settings.invalidateKey});
      await queryClient.invalidateQueries({queryKey: ['ai-agents']});
      onCompleted();
    },
    onError: err => showHttpErrorToast(err),
  });

  const statusTone = getStatusTone(agent.status);

  return (
    <div className="rounded-panel border border-divider bg-surface p-18 shadow-sm">
      <div className="flex items-start justify-between gap-12">
        <div className="flex items-center gap-12">
          <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-full border border-divider bg-alt text-lg font-semibold text-main">
            {agent.image ? (
              <img
                src={agent.image}
                alt={agent.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{agent.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-main">{agent.name}</h2>
            <div
              className={clsx(
                'mt-4 inline-flex items-center gap-6 rounded-full px-10 py-4 text-xs font-semibold',
                statusTone.badge,
              )}
            >
              {statusTone.icon}
              <span>{statusTone.label}</span>
            </div>
          </div>
        </div>
        <Button
          elementType={Link}
          to="/dashboard/reports/ai-agent"
          variant="outline"
          size="xs"
        >
          <Trans message="Analytics" />
        </Button>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-12 sm:grid-cols-4">
        <AgentMetric label="Requests" value={formatNumber(agent.total_requests)} />
        <AgentMetric label="Success" value={formatNumber(agent.successful_responses)} />
        <AgentMetric label="Response" value={formatMs(agent.response_time_ms)} />
        <AgentMetric label="Tokens" value={formatNumber(agent.token_usage)} />
      </div>

      <div className="mt-16 flex flex-wrap items-center justify-between gap-12 border-t border-divider pt-14 text-sm text-muted">
        <div>
          <Trans
            message="Last activity :date"
            values={{
              date: agent.last_activity_at ? (
                <FormattedDate date={agent.last_activity_at} preset="timestamp" />
              ) : (
                <Trans message="Never" />
              ),
            }}
          />
        </div>
        {agent.status !== 'connected' ? (
          <Button
            size="xs"
            variant="flat"
            color="positive"
            disabled={reconnect.isPending}
            onClick={() => reconnect.mutate()}
          >
            <Trans message="Reconnect" />
          </Button>
        ) : (
          <div className="text-xs font-medium text-positive">
            <Trans message="Connected and healthy" />
          </div>
        )}
      </div>

      {agent.error_message ? (
        <div className="mt-12 rounded-lg border border-danger/20 bg-danger/5 px-12 py-10 text-xs text-danger">
          {agent.error_message}
        </div>
      ) : null}
    </div>
  );
}

function AgentMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-divider bg-alt/70 px-12 py-10">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        <Trans message={label} />
      </div>
      <div className="mt-4 text-sm font-semibold text-main">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full rounded-panel border border-dashed border-divider bg-alt/40 p-32 text-center">
      <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-full bg-white/70 text-muted">
        <WifiOffIcon size="md" />
      </div>
      <h3 className="mt-16 text-xl font-semibold text-main">
        <Trans message="No AI agents connected yet" />
      </h3>
      <p className="mt-8 text-sm text-muted">
        <Trans message="Create an AI agent to start tracking availability and performance statistics." />
      </p>
      <Button
        elementType={Link}
        to="../agents"
        variant="flat"
        color="primary"
        className="mt-16"
      >
        <Trans message="Go to agents" />
      </Button>
    </div>
  );
}

function getStatusTone(status: AiAgentStatusAgent['status']) {
  switch (status) {
    case 'connected':
      return {
        label: 'Connected',
        badge: 'bg-positive/10 text-positive',
        icon: <WifiIcon size="xs" />,
      };
    case 'error':
      return {
        label: 'Error',
        badge: 'bg-danger/10 text-danger',
        icon: <SyncProblemIcon size="xs" />,
      };
    default:
      return {
        label: 'Disconnected',
        badge: 'bg-muted/10 text-muted',
        icon: <WifiOffIcon size="xs" />,
      };
  }
}

function formatMs(value: number | null | undefined) {
  if (value == null) {
    return '—';
  }

  if (value < 1000) {
    return `${value} ms`;
  }

  return `${(value / 1000).toFixed(1)} s`;
}

function formatNumber(value: number | null | undefined) {
  if (value == null) {
    return '—';
  }

  return new Intl.NumberFormat().format(value);
}

export default Component;
