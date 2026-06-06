import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ReportLayout} from '@app/dashboard/reports/layout/report-layout';
import {useReportDateRange} from '@app/dashboard/reports/layout/use-date-range';
import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {dateRangeValueToPayload} from '@ui/forms/input-field/date/date-range-picker/date-range-value';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import clsx from 'clsx';
import {ReactNode, useMemo, useState} from 'react';

type MilestoneType =
  | 'ticket.created'
  | 'ticket.assigned'
  | 'ticket.first_reply'
  | 'ticket.need_human_support'
  | 'ticket.closed'
  | 'ticket.reopened';

interface TicketAgent {
  id: number;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface TicketMilestoneReportItem {
  id: number;
  conversation_id: number;
  event_type: MilestoneType;
  actor_id?: number | null;
  actor?: TicketAgent | null;
  agents_on_ticket?: TicketAgent[];
  idle_before_first_reply_seconds?: number | null;
  conversation?: {
    id: number;
    subject?: string | null;
    channel?: string | null;
    group?: {id: number; name?: string | null} | null;
    user?: {id: number; name?: string | null; email?: string | null} | null;
  } | null;
  created_at: string;
}

interface TicketSummary {
  conversation_id: number;
  conversation?: TicketMilestoneReportItem['conversation'];
  group?: {id: number; name?: string | null} | null;
  agents: TicketAgent[];
  idle_before_first_reply_seconds?: number | null;
  need_human_at?: string | null;
  first_reply_at?: string | null;
  events: TicketMilestoneReportItem[];
}

interface TicketMilestonesReportResponse {
  pagination: PaginatedBackendResponse<TicketMilestoneReportItem>['pagination'];
  stats: {
    total_events: number;
    unique_tickets: number;
    avg_idle_before_first_reply_seconds: number | null;
    slow_responses_count: number;
  };
  tickets: TicketSummary[];
}

const milestoneFilters: {value: '' | MilestoneType; label: string; dot: string}[] = [
  {value: '', label: 'All', dot: 'bg-primary'},
  {value: 'ticket.created', label: 'Created', dot: 'bg-primary'},
  {value: 'ticket.assigned', label: 'Assigned', dot: 'bg-positive'},
  {value: 'ticket.first_reply', label: 'First reply', dot: 'bg-warning'},
  {value: 'ticket.need_human_support', label: 'Need human', dot: 'bg-danger'},
  {value: 'ticket.closed', label: 'Closed', dot: 'bg-chip'},
  {value: 'ticket.reopened', label: 'Reopened', dot: 'bg-primary'},
];

export function Component() {
  const [dateRange, setDateRange] = useReportDateRange();
  const [eventType, setEventType] = useState<'' | MilestoneType>('');
  const [agentId, setAgentId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'events' | 'tickets'>('events');

  const extraParams = {
    perPage: 100,
    ...(eventType ? {event_type: eventType} : {}),
    ...(agentId ? {agent_id: agentId} : {}),
    ...(groupId ? {group_id: groupId} : {}),
  };

  const query = useQuery(
    helpdeskQueries.reports.get<TicketMilestonesReportResponse>(
      'admin/reports/ticket-milestones',
      dateRange,
      extraParams,
    ),
  );

  const rows = query.data?.pagination.data ?? [];
  const tickets = query.data?.tickets ?? [];
  const stats = query.data?.stats;
  const normalizedSearch = search.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    return rows.filter(row => matchesSearch(row, normalizedSearch));
  }, [normalizedSearch, rows]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => ticketMatchesSearch(ticket, normalizedSearch));
  }, [normalizedSearch, tickets]);

  const exportUrl = (format: 'csv' | 'jsonl') => {
    const dateParams = dateRangeValueToPayload({dateRange});
    const params = new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(dateParams).map(([key, value]) => [key, `${value}`]),
      ),
      ...Object.fromEntries(
        Object.entries(extraParams).map(([key, value]) => [key, `${value}`]),
      ),
      export: format,
    });
    return `api/v1/admin/reports/ticket-milestones?${params.toString()}`;
  };

  return (
    <ReportLayout
      dateRange={dateRange}
      channel="ticket-milestones"
      onDateRangeChange={setDateRange}
      title={<Trans message="Ticket milestones" />}
    >
      <StaticPageTitle>
        <Trans message="Reports - Ticket milestones" />
      </StaticPageTitle>
      <div className="space-y-16">
        <StatsRow stats={stats} />
        <div className="flex flex-wrap items-center justify-between gap-12">
          <div className="inline-flex rounded border bg-alt p-3">
            <ViewButton active={view === 'events'} onClick={() => setView('events')}>
              <Trans message="Events" />
            </ViewButton>
            <ViewButton active={view === 'tickets'} onClick={() => setView('tickets')}>
              <Trans message="By ticket" />
            </ViewButton>
          </div>
          <div className="flex flex-wrap items-center gap-8">
            <TextField
              size="sm"
              className="w-120"
              label={<Trans message="Agent ID" />}
              value={agentId}
              onChange={e => setAgentId(e.target.value)}
            />
            <TextField
              size="sm"
              className="w-120"
              label={<Trans message="Group ID" />}
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              elementType="a"
              href={exportUrl('csv')}
              download
            >
              <Trans message="Export CSV" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              elementType="a"
              href={exportUrl('jsonl')}
              download
            >
              <Trans message="Export JSONL" />
            </Button>
          </div>
        </div>
        {view === 'events' ? (
          <EventsView
            rows={filteredRows}
            eventType={eventType}
            onEventTypeChange={setEventType}
            search={search}
            onSearchChange={setSearch}
          />
        ) : (
          <TicketsView
            tickets={filteredTickets}
            search={search}
            onSearchChange={setSearch}
          />
        )}
      </div>
    </ReportLayout>
  );
}

function StatsRow({stats}: {stats?: TicketMilestonesReportResponse['stats']}) {
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
      <StatCard label={<Trans message="Total events" />} value={stats?.total_events ?? 0} />
      <StatCard
        label={<Trans message="Unique tickets" />}
        value={stats?.unique_tickets ?? 0}
        valueClassName="text-primary"
      />
      <StatCard
        label={<Trans message="Avg idle time" />}
        value={formatDuration(stats?.avg_idle_before_first_reply_seconds)}
        valueClassName="text-warning"
      />
      <StatCard
        label={<Trans message="Slow responses (>90m)" />}
        value={stats?.slow_responses_count ?? 0}
        valueClassName="text-danger"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClassName,
}: {
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded border bg-alt px-14 py-12">
      <div className="mb-4 text-xs text-muted">{label}</div>
      <div className={clsx('text-2xl font-semibold', valueClassName)}>
        {value ?? '—'}
      </div>
    </div>
  );
}

function EventsView({
  rows,
  eventType,
  onEventTypeChange,
  search,
  onSearchChange,
}: {
  rows: TicketMilestoneReportItem[];
  eventType: '' | MilestoneType;
  onEventTypeChange: (value: '' | MilestoneType) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="space-y-12">
      <div className="flex min-w-0 flex-wrap items-center gap-8">
        <div className="shrink-0 text-xs text-muted">
          <Trans message="Milestone:" />
        </div>
        <div className="compact-scrollbar -mx-2 flex min-w-0 flex-1 gap-6 overflow-x-auto px-2 pb-2">
          {milestoneFilters.map(filter => (
            <button
              key={filter.value || 'all'}
              type="button"
              onClick={() => onEventTypeChange(filter.value)}
              className={clsx(
                'inline-flex min-h-32 shrink-0 items-center gap-6 whitespace-nowrap rounded-full border px-12 text-xs leading-none transition-colors',
                eventType === filter.value
                  ? 'border-primary bg-primary text-on-primary'
                  : 'bg text-muted hover:bg-hover',
              )}
            >
              {filter.value ? (
                <span className={clsx('size-6 shrink-0 rounded-full', filter.dot)} />
              ) : null}
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </div>
      <TextField
        size="sm"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search ticket, agent or group..."
      />
      <div className="dashboard-rounded-panel overflow-x-auto">
        <table className="w-full min-w-900 table-fixed text-left text-sm">
          <thead className="border-b bg-alt text-xs uppercase text-muted">
            <tr>
              <th className="w-[15%] p-12">
                <Trans message="Date" />
              </th>
              <th className="w-[11%] p-12">
                <Trans message="Ticket" />
              </th>
              <th className="w-[19%] p-12">
                <Trans message="Milestone" />
              </th>
              <th className="w-[25%] p-12">
                <Trans message="Agents on ticket" />
              </th>
              <th className="w-[20%] p-12">
                <Trans message="Idle before reply" />
              </th>
              <th className="w-[10%] p-12">
                <Trans message="Group" />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-b last:border-b-0 hover:bg-hover">
                <td className="p-12 text-xs text-muted">
                  <FormattedDate date={row.created_at} preset="long" />
                </td>
                <td className="p-12">
                  <span className="font-mono text-xs font-semibold text-primary">
                    #{row.conversation_id}
                  </span>
                </td>
                <td className="p-12">
                  <MilestoneBadge type={row.event_type} />
                </td>
                <td className="p-12">
                  <AgentChips agents={row.agents_on_ticket ?? []} />
                </td>
                <td className="p-12">
                  <IdleBadgeWithBar seconds={row.idle_before_first_reply_seconds} />
                </td>
                <td className="p-12">
                  <GroupBadge group={row.conversation?.group} />
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="p-24 text-center text-muted" colSpan={6}>
                  <Trans message="No ticket milestones found" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TicketsView({
  tickets,
  search,
  onSearchChange,
}: {
  tickets: TicketSummary[];
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="space-y-12">
      <TextField
        size="sm"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search ticket, agent or group..."
      />
      <div className="space-y-10">
        {tickets.map(ticket => (
          <TicketCard key={ticket.conversation_id} ticket={ticket} />
        ))}
        {!tickets.length ? (
          <div className="dashboard-rounded-panel p-24 text-center text-muted">
            <Trans message="No ticket milestones found" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TicketCard({ticket}: {ticket: TicketSummary}) {
  const idle = idleTone(ticket.idle_before_first_reply_seconds);
  return (
    <article className="overflow-hidden rounded border">
      <div className="flex flex-wrap items-center justify-between gap-10 border-b bg-alt px-14 py-12">
        <div className="flex flex-wrap items-center gap-8">
          <span className="font-mono text-sm font-semibold text-primary">
            #{ticket.conversation_id}
          </span>
          <GroupBadge group={ticket.group ?? ticket.conversation?.group} />
          {ticket.conversation?.subject ? (
            <span className="max-w-420 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted">
              {ticket.conversation.subject}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-8">
          <AgentChips agents={ticket.agents} />
          <span className={clsx('rounded-full px-9 py-4 text-xs font-semibold', idle.badge)}>
            {idle.label}
          </span>
        </div>
      </div>
      <div className="px-14 py-12">
        {ticket.idle_before_first_reply_seconds !== null &&
        ticket.idle_before_first_reply_seconds !== undefined ? (
          <div
            className={clsx(
              'mb-12 rounded border-l-4 px-10 py-7 text-xs font-medium',
              idle.callout,
            )}
          >
            {naturalIdleLabel(ticket.idle_before_first_reply_seconds)}
          </div>
        ) : null}
        <div className="space-y-0">
          {ticket.events.map((event, index) => (
            <TimelineStep
              key={event.id}
              event={event}
              isLast={index === ticket.events.length - 1}
              tagStart={ticket.need_human_at}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function TimelineStep({
  event,
  isLast,
  tagStart,
}: {
  event: TicketMilestoneReportItem;
  isLast: boolean;
  tagStart?: string | null;
}) {
  const badge = milestoneMeta(event.event_type);
  const offset = tagStart ? diffMinutes(tagStart, event.created_at) : null;
  return (
    <div className="relative flex gap-10">
      {!isLast ? (
        <span className="absolute bottom-0 left-8 top-22 w-1 bg-divider" />
      ) : null}
      <span
        className={clsx(
          'mt-2 flex size-16 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
          badge.dot,
        )}
      />
      <div className="pb-14">
        <div className="text-sm font-medium">
          {badge.label}
          {offset !== null && event.event_type !== 'ticket.need_human_support' ? (
            <span className="ml-6 text-xs font-normal text-muted">
              +{formatMinutes(offset)} from tag
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-6 text-xs text-muted">
          <FormattedDate date={event.created_at} preset="long" />
          {event.actor ? <AgentChip agent={event.actor} compact /> : null}
        </div>
      </div>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded px-14 py-6 text-xs transition-colors',
        active ? 'border bg text-main shadow-sm' : 'text-muted hover:text-main',
      )}
    >
      {children}
    </button>
  );
}

function MilestoneBadge({type}: {type: MilestoneType}) {
  const meta = milestoneMeta(type);
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-9 py-4 text-xs font-semibold',
        meta.badge,
      )}
    >
      {meta.label}
    </span>
  );
}

function milestoneMeta(type: MilestoneType) {
  switch (type) {
    case 'ticket.created':
      return {
        label: 'Ticket created',
        badge: 'bg-primary/10 text-primary',
        dot: 'bg-primary',
      };
    case 'ticket.assigned':
      return {
        label: 'Assigned',
        badge: 'bg-positive/10 text-positive',
        dot: 'bg-positive',
      };
    case 'ticket.first_reply':
      return {
        label: 'First reply',
        badge: 'bg-warning/10 text-warning',
        dot: 'bg-warning',
      };
    case 'ticket.need_human_support':
      return {
        label: 'Need human support',
        badge: 'bg-danger/10 text-danger',
        dot: 'bg-danger',
      };
    case 'ticket.closed':
      return {label: 'Closed', badge: 'bg-chip text-muted', dot: 'bg-muted'};
    case 'ticket.reopened':
      return {
        label: 'Reopened',
        badge: 'bg-primary/10 text-primary',
        dot: 'bg-primary',
      };
  }
}

function AgentChips({agents}: {agents: TicketAgent[]}) {
  if (!agents.length) {
    return <span className="text-xs text-muted">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-4">
      {agents.map(agent => (
        <AgentChip key={agent.id} agent={agent} />
      ))}
    </div>
  );
}

function AgentChip({agent, compact}: {agent: TicketAgent; compact?: boolean}) {
  const name = agentName(agent);
  return (
    <span
      className={clsx(
        'inline-flex max-w-180 items-center gap-5 rounded-full border bg-alt pr-8 text-xs',
        compact ? 'py-1 pl-2' : 'py-2 pl-3',
      )}
      title={name}
    >
      <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
        {initials(name)}
      </span>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">{name}</span>
    </span>
  );
}

function GroupBadge({group}: {group?: {id: number; name?: string | null} | null}) {
  return (
    <span className="inline-flex max-w-160 items-center rounded-full border bg-alt px-8 py-3 text-xs text-muted">
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
        {group?.name || group?.id || '—'}
      </span>
    </span>
  );
}

function IdleBadgeWithBar({seconds}: {seconds?: number | null}) {
  if (seconds === null || seconds === undefined) {
    return <span className="text-xs text-muted">—</span>;
  }
  const tone = idleTone(seconds);
  const pct = Math.min(100, Math.max(6, Math.round((seconds / (180 * 60)) * 100)));
  return (
    <div className="flex items-center gap-8">
      <span className={clsx('rounded-full px-9 py-4 text-xs font-semibold', tone.badge)}>
        {formatDuration(seconds)}
      </span>
      <span className="h-4 min-w-40 flex-1 rounded bg-alt">
        <span
          className={clsx('block h-4 rounded', tone.bar)}
          style={{width: `${pct}%`}}
        />
      </span>
    </div>
  );
}

function idleTone(seconds?: number | null) {
  if (seconds === null || seconds === undefined) {
    return {
      label: 'No tag event',
      badge: 'bg-chip text-muted',
      bar: 'bg-muted',
      callout: 'border-muted bg-alt text-muted',
    };
  }
  if (seconds <= 30 * 60) {
    return {
      label: `${formatDuration(seconds)} idle`,
      badge: 'bg-positive/10 text-positive',
      bar: 'bg-positive',
      callout: 'border-positive bg-positive/10 text-positive',
    };
  }
  if (seconds <= 90 * 60) {
    return {
      label: `${formatDuration(seconds)} idle`,
      badge: 'bg-warning/10 text-warning',
      bar: 'bg-warning',
      callout: 'border-warning bg-warning/10 text-warning',
    };
  }
  return {
    label: `${formatDuration(seconds)} idle`,
    badge: 'bg-danger/10 text-danger',
    bar: 'bg-danger',
    callout: 'border-danger bg-danger/10 text-danger',
  };
}

function naturalIdleLabel(seconds: number) {
  if (seconds <= 30 * 60) {
    return `${formatDuration(seconds)} idle before first reply - fast`;
  }
  if (seconds <= 90 * 60) {
    return `${formatDuration(seconds)} idle before first reply - moderate`;
  }
  return `${formatDuration(seconds)} idle before first reply - slow, over 90 min`;
}

function formatDuration(seconds?: number | null) {
  if (seconds === null || seconds === undefined) {
    return '—';
  }
  const minutes = Math.max(0, Math.round(seconds / 60));
  return formatMinutes(minutes);
}

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function diffMinutes(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(diff) || diff < 0) {
    return null;
  }
  return Math.round(diff / 60000);
}

function agentName(agent: TicketAgent) {
  return agent.name || agent.email || `#${agent.id}`;
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

function matchesSearch(row: TicketMilestoneReportItem, search: string) {
  if (!search) {
    return true;
  }
  const haystack = [
    row.conversation_id,
    row.conversation?.subject,
    row.conversation?.group?.name,
    row.conversation?.group?.id,
    row.actor?.name,
    row.actor?.email,
    ...(row.agents_on_ticket ?? []).flatMap(agent => [
      agent.name,
      agent.email,
      agent.id,
    ]),
  ]
    .filter(value => value !== null && value !== undefined)
    .join(' ')
    .toLowerCase();
  return haystack.includes(search);
}

function ticketMatchesSearch(ticket: TicketSummary, search: string) {
  if (!search) {
    return true;
  }
  const haystack = [
    ticket.conversation_id,
    ticket.conversation?.subject,
    ticket.group?.name,
    ticket.group?.id,
    ...ticket.agents.flatMap(agent => [agent.name, agent.email, agent.id]),
  ]
    .filter(value => value !== null && value !== undefined)
    .join(' ')
    .toLowerCase();
  return haystack.includes(search);
}
