import {AttributeRenderer} from '@app/attributes/rendering/attribute-renderer';
import {ConversationPriority} from '@app/dashboard/conversations/conversation-page/details-sidebar/conversation-priority';
import {statusCategory} from '@app/dashboard/statuses/status-category';
import {TicketsPortalConversationResponse} from '@app/help-center/tickets-portal/ticket-page/conversation-response';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {DateFormatPresets, FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import clsx from 'clsx';
import {ReactNode} from 'react';

interface Props {
  data: TicketsPortalConversationResponse;
  className?: string;
}
export function TicketDetails({data, className}: Props) {
  return (
    <aside className={className}>
      <ConversationDetail>
        <Trans message="Requester" />
        {data.conversation.user?.name}
      </ConversationDetail>
      <ConversationDetail>
        <Trans message="Created" />
        <FormattedDate
          date={data.conversation.created_at}
          options={DateFormatPresets.long}
        />
      </ConversationDetail>
      <ConversationDetail showDivider>
        <Trans message="Last activity" />
        <FormattedDate
          date={data.conversation.updated_at}
          options={DateFormatPresets.long}
        />
      </ConversationDetail>
      <ConversationDetail>
        <Trans message="Assigned to" />
        {data.conversation.assignee ? data.conversation.assignee.name : '-'}
      </ConversationDetail>
      <ConversationDetail>
        <Trans message="ID" />
        <div>#{data.conversation.id}</div>
      </ConversationDetail>
      <ConversationDetail>
        <Trans message="Status" />
        <Chip
          radius="rounded-button font-semibold"
          size="sm"
          color={
            data.conversation.status_category > statusCategory.closed
              ? 'primary'
              : undefined
          }
        >
          {data.conversation.status}
        </Chip>
      </ConversationDetail>
      <ConversationDetail showDivider={!!data.attributes.length}>
        <Trans message="Priority" />
        <ConversationPriority priority={data.conversation.priority} />
      </ConversationDetail>
      {data.attributes.map(attribute => (
        <ConversationDetail key={attribute.key}>
          <Trans message={attribute.name} />
          <AttributeRenderer attribute={attribute} />
        </ConversationDetail>
      ))}
    </aside>
  );
}

interface ConversationDetailProps {
  children: [ReactNode, ReactNode];
  showDivider?: boolean;
}
export function ConversationDetail({
  children,
  showDivider,
}: ConversationDetailProps) {
  return (
    <div
      className={clsx(
        'flex gap-12 pt-10 text-sm',
        showDivider ? 'mb-20 border-b pb-20' : 'pb-10',
      )}
    >
      <div className="w-2/5 text-muted">{children[0]}</div>
      <div className="w-3/5">{children[1]}</div>
    </div>
  );
}
