import {
  removeAnimatingMessage,
  shouldAnimate,
} from '@app/dashboard/conversations/conversation-page/messages/animating-messages';
import clsx from 'clsx';
import {ReactNode} from 'react';

type Props = {
  children: ReactNode;
  uuid: string;
  className?: string;
};
export function AnimatedChatMessage({children, uuid, className}: Props) {
  return (
    <div
      className={clsx(
        className,
        shouldAnimate(uuid) && 'animated-chat-message',
      )}
      onAnimationEnd={() => removeAnimatingMessage(uuid)}
    >
      {children}
    </div>
  );
}
