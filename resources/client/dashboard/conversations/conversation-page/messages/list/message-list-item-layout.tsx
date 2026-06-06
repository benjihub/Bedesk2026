import {MessageAuthorName} from '@app/dashboard/conversations/conversation-page/messages/message-author-name';
import {MessageAvatar} from '@app/dashboard/conversations/conversation-page/messages/message-avatar';
import {MessageDate} from '@app/dashboard/conversations/conversation-page/messages/message-date';
import clsx from 'clsx';
import {ReactNode} from 'react';
import {Link} from 'react-router';
import {ConversationMessage} from '../conversation-message';

interface Props {
  message: Pick<ConversationMessage, 'author' | 'user' | 'created_at'> & {
    type: 'note' | string;
  };
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}
export function MessageListItemLayout({
  message,
  children,
  actions,
  className,
}: Props) {
  let avatar = <MessageAvatar message={message} size="sm" />;

  if (message.user) {
    avatar = (
      <Link
        to={`/dashboard/customers/${message.user.id}`}
        className="flex-shrink-0"
        target="_blank"
      >
        {avatar}
      </Link>
    );
  }

  return (
    <div
      className={clsx(
        'flex items-start gap-12 py-36',
        className,
        message.type === 'note' && 'bg-note dark:bg-[#45380c]',
      )}
    >
      {avatar}
      <div className="min-w-0 flex-auto">
        <div className="mb-4 flex min-h-30 items-center gap-8">
          <div className="-mt-6 mr-auto text-sm font-semibold">
            <MessageAuthorName message={message} />
          </div>
          {actions}
          <div className="flex-shrink-0 text-xs text-muted">
            <MessageDate date={message.created_at} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
