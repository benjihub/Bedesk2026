import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {statusCategory} from '@app/dashboard/statuses/status-category';
import {useQuery} from '@tanstack/react-query';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {ProgressCircle} from '@ui/progress/progress-circle';
import clsx from 'clsx';

export interface RecentConversation {
  id: number;
  subject: string | null;
  description: string | null;
  type: string;
  created_at?: string;
  status_category: number;
}

interface Props {
  customerId: number | string;
  onSelected: (conversation: RecentConversation) => void;
  excludeId?: number;
}
export function RecentConversationsPanel({
  customerId,
  onSelected,
  excludeId,
}: Props) {
  const {data} = useQuery(
    helpdeskQueries.conversations.recent(customerId, excludeId),
  );

  if (!data) {
    return (
      <div className="flex justify-center">
        <ProgressCircle isIndeterminate size="xs" />
      </div>
    );
  }

  if (!data.conversations.length) {
    return (
      <div className="font-italic text-xs text-muted">
        <Trans message="No recent conversations" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.conversations.map(conversation => {
        const message = conversation.description;
        if (!message) {
          return null;
        }
        const startedAt = (
          <FormattedRelativeTime date={conversation.created_at} style="long" />
        );
        return (
          <div
            key={conversation.id}
            className="-mx-12 cursor-pointer rounded-panel px-12 py-8 transition-button hover:bg-hover"
            onClick={() => onSelected(conversation)}
          >
            <div
              className={clsx(
                'mb-4 overflow-hidden overflow-ellipsis whitespace-nowrap text-sm',
                conversation.status_category >= statusCategory.closed
                  ? 'font-medium'
                  : 'text-muted',
              )}
            >
              {conversation.subject ? (
                conversation.subject
              ) : (
                <Trans message="Started :time" values={{time: startedAt}} />
              )}
            </div>
            <div className="text-[13px] text-muted">
              <div className="min-w-0 overflow-hidden overflow-ellipsis whitespace-nowrap">
                {conversation.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
