import {AttributeRenderer} from '@app/attributes/rendering/attribute-renderer';
import {ConversationListItemType} from '@app/dashboard/conversation';
import {CustomerAvatar} from '@app/dashboard/conversations/avatars/customer-avatar';
import {ConversationPriority} from '@app/dashboard/conversations/conversation-page/details-sidebar/conversation-priority';
import {CustomerName} from '@app/dashboard/conversations/customer-name';
import {getStatusColor} from '@app/dashboard/conversations/utils/get-status-color';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {UnseenMessagesBadge} from '@app/dashboard/websockets/unseen-messages-badge';
import {UserAvatar} from '@common/auth/user-avatar';
import {ColumnConfig} from '@common/datatable/column-config';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Avatar} from '@ui/avatar/avatar';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {ChipList} from '@ui/forms/input-field/chip-field/chip-list';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {MessagesSquareIcon} from '@ui/icons/lucide/messages-square-icon';
import {ConfirmationNumberIcon} from '@ui/icons/material/ConfirmationNumber';
import {SupervisorAccountIcon} from '@ui/icons/material/SupervisorAccount';
import {useMemo} from 'react';
import {Fragment} from 'react/jsx-runtime';

export const useConversationsTableColumnsConfig = (
  activeColumns: string[],
): ColumnConfig<ConversationListItemType>[] => {
  const attributesQuery = useSuspenseQuery(
    helpdeskQueries.attributes.normalizedList({
      type: 'conversation',
      for: 'agent',
    }),
  );
  const attributes = attributesQuery.data.attributes;

  return useMemo(() => {
    const attributeColumns: ColumnConfig<ConversationListItemType>[] =
      activeColumns
        .filter(prefixedKey => prefixedKey.startsWith('ca_'))
        .map(prefixedKey => {
          const key = prefixedKey.replace('ca_', '');
          const attribute = attributes.find(f => f.key === key);
          if (!attribute) return;

          return {
            key: prefixedKey,
            header: () => <Trans message={attribute.name} />,
            allowsSorting: false,
            body: conversation => {
              const value = conversation.attributes?.[key] ?? null;
              const attributeWithValue = {
                ...attribute,
                value,
              };
              return <AttributeRenderer attribute={attributeWithValue} />;
            },
          } as ColumnConfig<ConversationListItemType>;
        })
        .filter(col => !!col);

    if (attributeColumns.length > 0) {
      return [...defaultColumns, ...attributeColumns];
    }

    return defaultColumns;
  }, [activeColumns, attributes]);
};

const defaultColumns: ColumnConfig<ConversationListItemType>[] = [
  {
    key: 'id',
    allowsSorting: true,
    header: () => <Trans message="ID" />,
    body: conversation => conversation.id,
  },
  {
    key: 'status',
    sortingKey: 'status_category',
    allowsSorting: true,
    maxWidth: 'max-w-100',
    header: () => <Trans message="Status" />,
    body: conversation => (
      <Chip
        size="xs"
        color={getStatusColor(conversation.status_category).button}
        fontWeight="font-semibold"
      >
        {conversation.status_label}
      </Chip>
    ),
  },
  {
    key: 'type',
    allowsSorting: true,
    header: () => <Trans message="Type" />,
    body: conversation => (
      <div className="flex items-center gap-6">
        {conversation.type === 'ticket' ? (
          <Fragment>
            <ConfirmationNumberIcon size="xs" />
            <Trans message="Ticket" />
          </Fragment>
        ) : (
          <Fragment>
            <MessagesSquareIcon size="xs" />
            <Trans message="Chat" />
          </Fragment>
        )}
      </div>
    ),
  },
  {
    key: 'channel',
    allowsSorting: true,
    header: () => <Trans message="Channel" />,
    body: conversation => (
      <div className="capitalize">
        <Trans message={conversation.channel} />
      </div>
    ),
  },
  {
    key: 'priority',
    allowsSorting: true,
    header: () => <Trans message="Priority" />,
    body: conversation => (
      <ConversationPriority priority={conversation.priority} />
    ),
  },
  {
    key: 'user_id',
    allowsSorting: true,
    maxWidth: 'max-w-200',
    header: () => <Trans message="Customer" />,
    body: conversation => (
      <div className="flex items-center gap-12 pl-6 pr-24">
        <CustomerAvatar user={conversation.user} size="sm" />
        <CustomerName user={conversation.user} />
      </div>
    ),
  },
  {
    key: 'subject',
    maxWidth: 'max-w-400',
    header: () => <Trans message="Subject" />,
    body: conversation => conversation.subject,
  },
  {
    key: 'summary',
    maxWidth: 'max-w-400',
    header: () => <Trans message="Summary" />,
    body: conversation => <Summary conversation={conversation} />,
  },
  {
    key: 'assignee_id',
    allowsSorting: true,
    maxWidth: 'max-w-200',
    header: () => <Trans message="Assignee" />,
    body: conversation =>
      conversation.assignee ? (
        <div className="flex items-center gap-8">
          <UserAvatar size="xs" withLink={false} user={conversation.assignee} />
          {conversation.assignee.name}
        </div>
      ) : (
        <div className="flex items-center gap-8">
          <SupervisorAccountIcon size="w-18 h-18" />
          <Trans message="Unassigned" />
        </div>
      ),
  },
  {
    key: 'group_id',
    allowsSorting: true,
    maxWidth: 'max-w-200',
    header: () => <Trans message="Group" />,
    body: conversation =>
      conversation.group ? (
        <div className="flex items-center gap-8">
          <Avatar
            size="xs"
            fallback="initials"
            label={conversation.group.name}
          />
          {conversation.group.name}
        </div>
      ) : null,
  },
  {
    key: 'updated_at',
    allowsSorting: true,
    width: 'w-100',
    header: () => <Trans message="Last updated" />,
    body: conversation => (
      <FormattedRelativeTime date={conversation.updated_at} style="narrow" />
    ),
  },
  {
    key: 'created_at',
    width: 'w-100',
    allowsSorting: true,
    header: () => <Trans message="Request date" />,
    body: conversation => (
      <FormattedRelativeTime date={conversation.created_at} style="narrow" />
    ),
  },
  {
    key: 'closed_at',
    width: 'w-100',
    allowsSorting: true,
    header: () => <Trans message="Solved at" />,
    body: conversation => (
      <FormattedRelativeTime date={conversation.closed_at} style="narrow" />
    ),
  },
  {
    key: 'closed_by',
    allowsSorting: true,
    header: () => <Trans message="Closed by" />,
    body: conversation => conversation.closed_by,
  },
  {
    key: 'assigned_at',
    width: 'w-100',
    allowsSorting: true,
    header: () => <Trans message="Assigned at" />,
    body: conversation => (
      <FormattedRelativeTime date={conversation.assigned_at} style="narrow" />
    ),
  },
];

interface SummaryProps {
  conversation: ConversationListItemType;
}
function Summary({conversation}: SummaryProps) {
  return (
    <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
      <div className="flex items-center gap-10">
        <UnseenMessagesBadge conversationId={conversation.id} />
        {!!conversation.tags?.length && (
          <ChipList size="xs" wrap={false}>
            {conversation.tags.slice(0, 3).map(tag => (
              <Chip key={tag.id}>{tag.name}</Chip>
            ))}
          </ChipList>
        )}
        <div>{conversation.subject}</div>
      </div>
      {conversation.latest_message && (
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap pt-4 font-normal text-muted">
          {conversation.latest_message.body}
        </div>
      )}
    </div>
  );
}
