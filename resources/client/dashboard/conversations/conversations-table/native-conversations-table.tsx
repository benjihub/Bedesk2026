import {ConversationListItemType} from '@app/dashboard/conversation';
import {CustomerAvatar} from '@app/dashboard/conversations/avatars/customer-avatar';
import {CustomerName} from '@app/dashboard/conversations/customer-name';
import {getStatusColor} from '@app/dashboard/conversations/utils/get-status-color';
import {UnseenMessagesBadge} from '@app/dashboard/websockets/unseen-messages-badge';
import {UserAvatar} from '@common/auth/user-avatar';
import {SortDescriptor} from '@common/ui/tables/types/sort-descriptor';
import {Avatar} from '@ui/avatar/avatar';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {ChipList} from '@ui/forms/input-field/chip-field/chip-list';
import {Checkbox} from '@ui/forms/toggle/checkbox';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {SupervisorAccountIcon} from '@ui/icons/material/SupervisorAccount';
import clsx from 'clsx';

interface Props {
  data: ConversationListItemType[] | undefined;
  selectedTickets?: number[];
  onSelectionChange?: (conversationIds: number[]) => void;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (sortDescriptor: SortDescriptor) => void;
  className?: string;
  onRowAction: (item: ConversationListItemType) => void;
}

export function NativeConversationsTable({
  data,
  selectedTickets = [],
  onSelectionChange,
  sortDescriptor,
  onSortChange,
  className,
  onRowAction,
}: Props) {
  const handleSort = (key: string) => {
    if (!onSortChange) return;

    const newDescriptor: SortDescriptor = {
      orderBy: key,
      orderDir:
        sortDescriptor?.orderBy === key && sortDescriptor?.orderDir === 'asc'
          ? 'desc'
          : 'asc',
    };

    onSortChange(newDescriptor);
  };

  const handleRowClick = (item: ConversationListItemType) => {
    onRowAction(item);
  };

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: number,
  ) => {
    e.stopPropagation();
    if (!onSelectionChange) return;

    const isChecked = e.target.checked;
    if (isChecked) {
      onSelectionChange([...selectedTickets, id]);
    } else {
      onSelectionChange(selectedTickets.filter(ticketId => ticketId !== id));
    }
  };

  return (
    <div className={clsx('overflow-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead className="text-xs font-normal text-muted">
          <tr className="h-36 border-b">
            <th className="w-40 pl-18 text-left">
              <Checkbox
                size="sm"
                onChange={e => {
                  if (!onSelectionChange || !data) return;
                  if (e.target.checked) {
                    onSelectionChange(data.map(item => item.id));
                  } else {
                    onSelectionChange([]);
                  }
                }}
                checked={
                  selectedTickets.length > 0 &&
                  data &&
                  selectedTickets.length === data.length
                }
              />
            </th>
            <th className="max-w-max px-12 text-left">
              <Trans message="Status" />
            </th>
            <th
              className="max-w-200 cursor-pointer px-12 text-left"
              onClick={() => handleSort('user_id')}
            >
              <Trans message="Customer" />
              {sortDescriptor?.orderBy === 'user_id' && (
                <span className="ml-1">
                  {sortDescriptor.orderDir === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th className="max-w-400 px-12 text-left">
              <Trans message="Summary" />
            </th>
            <th
              className="cursor-pointer px-12 text-left"
              onClick={() => handleSort('assignee_id')}
            >
              <Trans message="Assignee" />
              {sortDescriptor?.orderBy === 'assignee_id' && (
                <span className="ml-1">
                  {sortDescriptor.orderDir === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th
              className="cursor-pointer px-12 text-left"
              onClick={() => handleSort('group_id')}
            >
              <Trans message="Group" />
              {sortDescriptor?.orderBy === 'group_id' && (
                <span className="ml-1">
                  {sortDescriptor.orderDir === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th
              className="cursor-pointer px-12 text-left"
              onClick={() => handleSort('updated_at')}
            >
              <Trans message="Last updated" />
              {sortDescriptor?.orderBy === 'updated_at' && (
                <span className="ml-1">
                  {sortDescriptor.orderDir === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {data?.map(conversation => (
            <tr
              key={conversation.id}
              className={clsx(
                'h-64 cursor-pointer border-b hover:bg-hover',
                selectedTickets.includes(conversation.id) &&
                  'bg-primary/selected',
              )}
              onClick={() => handleRowClick(conversation)}
            >
              <td className="pl-18 pr-12">
                <Checkbox
                  size="sm"
                  checked={selectedTickets.includes(conversation.id)}
                  onChange={e => handleCheckboxChange(e, conversation.id)}
                  onClick={e => e.stopPropagation()}
                />
              </td>
              <td className="max-w-max px-12">
                <div
                  className={clsx(
                    'w-max rounded-button px-8 py-2 text-xs font-bold text-on-primary',
                    getStatusColor(conversation.status_category).bg,
                  )}
                >
                  {conversation.status_label}
                </div>
              </td>
              <td className="max-w-144 px-12">
                <div className="flex items-center gap-12 whitespace-nowrap">
                  <CustomerAvatar user={conversation.user} size="sm" />
                  <CustomerName
                    user={conversation.user}
                    className="overflow-hidden overflow-ellipsis"
                  />
                </div>
              </td>
              <td className="max-w-400 px-12">
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
              </td>
              <td className="whitespace-nowrap px-12">
                {conversation.assignee ? (
                  <div className="flex items-center gap-8">
                    <UserAvatar
                      size="xs"
                      withLink={false}
                      user={conversation.assignee}
                    />
                    {conversation.assignee.name}
                  </div>
                ) : (
                  <div className="flex items-center gap-8">
                    <SupervisorAccountIcon size="w-18 h-18" />
                    <Trans message="Unassigned" />
                  </div>
                )}
              </td>
              <td className="whitespace-nowrap px-12">
                {conversation.group ? (
                  <div className="flex items-center gap-8">
                    <Avatar
                      size="xs"
                      fallback="initials"
                      label={conversation.group.name}
                    />
                    {conversation.group.name}
                  </div>
                ) : null}
              </td>
              <td className="whitespace-nowrap px-12">
                <FormattedRelativeTime
                  date={conversation.updated_at}
                  style="narrow"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
