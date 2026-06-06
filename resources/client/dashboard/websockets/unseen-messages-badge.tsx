import {useUnseenConversationsStore} from '@app/dashboard/websockets/websocket-updates-notifier';
import clsx from 'clsx';

interface Props {
  conversationId: number;
  className?: string;
}
export function UnseenMessagesBadge({conversationId, className}: Props) {
  const hasUnseenMessages = useUnseenConversationsStore(s =>
    s.conversationsWithUnseenMessages.includes(conversationId),
  );
  return hasUnseenMessages ? (
    <div
      className={clsx(
        'h-12 w-12 flex-shrink-0 rounded-full bg-danger',
        className,
      )}
    />
  ) : null;
}
