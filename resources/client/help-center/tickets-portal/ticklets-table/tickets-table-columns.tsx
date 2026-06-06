import {ConversationListItemType} from '@app/dashboard/conversation';
import {statusCategory} from '@app/dashboard/statuses/status-category';
import {ColumnConfig} from '@common/datatable/column-config';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';

export const ticketsTableColumns: ColumnConfig<ConversationListItemType>[] = [
  {
    key: 'summary',
    visibleInMode: 'all',
    header: () => <Trans message="Summary" />,
    body: conversation => <Summary conversation={conversation} />,
    width: 'flex-3 min-w-280',
  },
  {
    key: 'id',
    allowsSorting: true,
    header: () => <Trans message="ID" />,
    width: 'w-90',
    body: conversation => `#${conversation.id}`,
  },
  {
    key: 'created_at',
    allowsSorting: true,
    header: () => <Trans message="Created" />,
    width: 'w-100',
    body: conversation => (
      <FormattedRelativeTime date={conversation.created_at} style="narrow" />
    ),
  },
  {
    key: 'updated_at',
    allowsSorting: true,
    header: () => <Trans message="Last updated" />,
    width: 'w-100',
    body: conversation => (
      <FormattedRelativeTime date={conversation.updated_at} style="narrow" />
    ),
  },
  {
    key: 'status',
    sortingKey: 'status_category',
    allowsSorting: true,
    header: () => <Trans message="Status" />,
    visibleInMode: 'all',
    width: 'w-112',
    body: conversation => (
      <div className="w-max">
        <Chip
          size="sm"
          color={
            conversation.status_category >= statusCategory.pending
              ? 'primary'
              : undefined
          }
          radius="rounded-button"
          className="min-w-64 text-center font-medium capitalize"
        >
          <Trans
            message={
              conversation.customer_status_label ?? conversation.status_label
            }
          />
        </Chip>
      </div>
    ),
  },
];

interface SummaryProps {
  conversation: ConversationListItemType;
}
function Summary({conversation}: SummaryProps) {
  return (
    <div className="pr-14">
      <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
        {conversation.subject}
      </div>
      {conversation.latest_message && (
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap pt-4 font-normal text-muted">
          {conversation.latest_message.body}
        </div>
      )}
    </div>
  );
}
