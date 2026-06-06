import {ConversationContentItem} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {EventIcon} from '@app/dashboard/conversations/conversation-page/messages/events/event-icon';
import {useEventText} from '@app/dashboard/conversations/conversation-page/messages/events/use-event-text';
import {ListViewDivider} from '@app/dashboard/conversations/conversation-page/messages/list/list-view-divider';
import {MessageDate} from '@app/dashboard/conversations/conversation-page/messages/message-date';
import {Trans} from '@ui/i18n/trans';
import clsx from 'clsx';
import {Fragment} from 'react';

interface Props {
  message: ConversationContentItem;
  messages: ConversationContentItem[];
  index: number;
  variant: 'agent' | 'customer';
  className?: string;
}

export function ListViewEventItem({
  message,
  messages,
  index,
  variant,
  className,
}: Props) {
  const eventText = useEventText({message, variant});

  if (eventText === null) return null;

  const prevMessageIsEvent = messages[index - 1]?.type === 'event';
  const nextMessageIsEvent = messages[index + 1]?.type === 'event';

  return (
    <Fragment>
      <div
        className={clsx(
          'flex items-center gap-12 text-sm',
          className,
          nextMessageIsEvent ? 'pb-4' : 'pb-24',
          prevMessageIsEvent ? 'pt-4' : 'pt-24',
        )}
      >
        <EventIcon message={message} size="sm" className="ml-4 mr-8" />
        <Trans {...eventText} />
        <time className="ml-auto text-xs text-muted">
          <MessageDate date={message.created_at} />
        </time>
      </div>
      {!nextMessageIsEvent && (
        <ListViewDivider messages={messages} index={index} />
      )}
    </Fragment>
  );
}
