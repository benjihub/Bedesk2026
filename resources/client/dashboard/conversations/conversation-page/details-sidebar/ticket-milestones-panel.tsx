import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {TicketMilestone} from '@app/dashboard/conversation';
import {useQuery} from '@tanstack/react-query';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {FormattedDuration} from '@ui/i18n/formatted-duration';
import {Trans} from '@ui/i18n/trans';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {Timeline, TimelineItem} from '@ui/timeline/timeline';
import clsx from 'clsx';
import {ReactNode} from 'react';

interface Props {
  conversationId: number | string;
}

export function TicketMilestonesPanel({conversationId}: Props) {
  const {data, isLoading} = useQuery(
    helpdeskQueries.conversations.milestones(conversationId),
  );

  if (isLoading || !data) {
    return (
      <div className="flex justify-center">
        <ProgressCircle isIndeterminate size="xs" />
      </div>
    );
  }

  return (
    <div className="space-y-14 text-xs">
      <div className="rounded border bg-alt p-10 text-muted">
        <Trans message="Ticket agents and idle time after handoff." />
      </div>
      <div>
        <div className="mb-6 font-semibold">
          <Trans message="Agents" />
        </div>
        <div className="flex flex-wrap gap-4">
          {data.metrics.agents_involved.length ? (
            data.metrics.agents_involved.map(agent => (
              <AgentChip
                key={agent.id}
                name={agent.name || agent.email || `#${agent.id}`}
              />
            ))
          ) : (
            <span className="text-muted">
              <Trans message="No agents yet" />
            </span>
          )}
        </div>
      </div>
      <IdleCallout seconds={data.metrics.idle_before_first_reply_seconds} />
      <div className="grid grid-cols-2 gap-8">
        <Metric
          label={<Trans message="First reply" />}
          seconds={data.metrics.time_to_first_reply_seconds}
        />
        <Metric
          label={<Trans message="Resolution" />}
          seconds={data.metrics.resolution_time_seconds}
        />
      </div>
      {data.metrics.agent_handling_durations.length ? (
        <div>
          <div className="mb-6 font-semibold">
            <Trans message="Handling duration" />
          </div>
          <div className="space-y-4">
            {data.metrics.agent_handling_durations.map((span, index) => (
              <div key={`${span.agent_id}-${span.started_at}-${index}`}>
                <span>{span.agent?.name || `#${span.agent_id}`}</span>
                <span className="text-muted"> · </span>
                {span.duration_seconds === null ? (
                  <span className="text-muted">
                    <Trans message="In progress" />
                  </span>
                ) : (
                  <FormattedDuration seconds={span.duration_seconds} verbose />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {data.timeline.length ? (
        <Timeline className="overflow-x-hidden">
          {data.timeline.map((event, index) => (
            <TimelineItem isActive={index === 0} key={event.id}>
              <TicketMilestoneRow event={event} />
            </TimelineItem>
          ))}
        </Timeline>
      ) : (
        <div className="rounded border border-dashed p-10 text-muted">
          <Trans message="No ticket milestones have been logged yet" />
        </div>
      )}
    </div>
  );
}

interface MetricProps {
  label: ReactNode;
  seconds: number | null;
}
function Metric({label, seconds}: MetricProps) {
  return (
    <div className="rounded border p-8">
      <div className="mb-4 text-muted">{label}</div>
      <div className="font-semibold">
        {seconds === null ? (
          '—'
        ) : (
          <FormattedDuration seconds={seconds} verbose />
        )}
      </div>
    </div>
  );
}

interface TicketMilestoneRowProps {
  event: TicketMilestone;
}

function TicketMilestoneRow({event}: TicketMilestoneRowProps) {
  return (
    <div>
      <div className="font-medium">{milestoneLabel(event)}</div>
      <div className="text-xs text-muted">
        <MilestoneTimestamp date={event.created_at} />
        {event.actor ? (
          <span>
            {' · '}
            {event.actor.name || event.actor.email}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MilestoneTimestamp({date}: {date: string}) {
  return (
    <>
      <FormattedDate date={date} options={milestoneDateOptions} />
      {' - '}
      <FormattedDate date={date} options={milestoneTimeOptions} />
    </>
  );
}

function AgentChip({name}: {name: string}) {
  return (
    <span className="inline-flex max-w-full items-center gap-5 rounded-full border bg px-8 py-3">
      <span className="flex size-18 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-semibold text-primary">
        {initials(name)}
      </span>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
        {name}
      </span>
    </span>
  );
}

function IdleCallout({seconds}: {seconds: number | null}) {
  const tone = idleTone(seconds);
  return (
    <div className={clsx('rounded border-l-4 px-10 py-8', tone.className)}>
      <div className="font-semibold">
        <Trans message="Idle before reply" />
      </div>
      <div className="mt-2">
        {seconds === null ? (
          <Trans message="No idle data yet" />
        ) : (
          naturalIdleLabel(seconds)
        )}
      </div>
    </div>
  );
}

function idleTone(seconds: number | null) {
  if (seconds === null) {
    return {className: 'border-muted bg-alt text-muted'};
  }
  if (seconds <= 30 * 60) {
    return {className: 'border-positive bg-positive/10 text-positive'};
  }
  if (seconds <= 90 * 60) {
    return {className: 'border-warning bg-warning/10 text-warning'};
  }
  return {className: 'border-danger bg-danger/10 text-danger'};
}

function naturalIdleLabel(seconds: number) {
  const duration = formatDuration(seconds);
  if (seconds <= 30 * 60) {
    return `${duration} - fast`;
  }
  if (seconds <= 90 * 60) {
    return `${duration} - moderate`;
  }
  return `${duration} - slow`;
}

const milestoneDateOptions: Intl.DateTimeFormatOptions = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
};

const milestoneTimeOptions: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZoneName: 'short',
};

function formatDuration(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60));
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
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

function milestoneLabel(event: TicketMilestone) {
  switch (event.event_type) {
    case 'ticket.created':
      return <Trans message="Ticket created" />;
    case 'ticket.assigned':
      return <Trans message="Ticket assigned" />;
    case 'ticket.first_reply':
      return <Trans message="First agent reply" />;
    case 'ticket.need_human_support':
      return <Trans message="Need human support" />;
    case 'ticket.closed':
      return <Trans message="Ticket closed" />;
    case 'ticket.reopened':
      return <Trans message="Ticket reopened" />;
  }
}
