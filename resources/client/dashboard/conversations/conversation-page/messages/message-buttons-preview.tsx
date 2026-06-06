import {ConversationMessage} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import clsx from 'clsx';

interface Props {
  buttons: NonNullable<ConversationMessage['data']>['buttons'];
  className?: string;
}
export function MessageButtonsPreview({buttons, className}: Props) {
  return (
    <div className={clsx('flex flex-wrap gap-6', className)}>
      {buttons?.map((button, index) => (
        <div
          key={index}
          className="whitespace-nowrap rounded-button border border-primary/50 px-12 py-4 text-xs font-medium text-primary"
        >
          {button.name}
        </div>
      ))}
    </div>
  );
}
