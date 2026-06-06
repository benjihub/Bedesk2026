import {AnimatedChatMessage} from '@app/dashboard/conversations/conversation-page/messages/animated-chat-message';
import {PlaceholderConversationMessage} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {FeedBubble} from '@app/dashboard/conversations/conversation-page/messages/feed/feed-bubble';
import {FeedMessageLayout} from '@app/dashboard/conversations/conversation-page/messages/feed/feed-message-layout';
import {AvatarProps} from '@ui/avatar/avatar';
import {ReactElement} from 'react';

interface Props {
  align?: 'left' | 'right';
  avatar?: ReactElement<AvatarProps>;
  color?: 'primary' | 'chip';
  message: PlaceholderConversationMessage;
}
export function TypingIndicator({
  align = 'left',
  avatar,
  color = 'chip',
  message,
}: Props) {
  return (
    <AnimatedChatMessage uuid={message.uuid}>
      <FeedMessageLayout align={align} avatar={avatar}>
        <FeedBubble color={color}>
          <div className="flex min-h-18 min-w-40 items-center justify-center gap-x-4">
            <div className="size-8 animate-[0.9s_widgetTypingBounce_infinite] rounded-full bg-text-muted" />
            <div className="size-8 animate-[0.9s_widgetTypingBounce_infinite_150ms] rounded-full bg-text-muted" />
            <div className="size-8 animate-[0.9s_widgetTypingBounce_infinite_300ms] rounded-full bg-text-muted" />
          </div>
        </FeedBubble>
      </FeedMessageLayout>
    </AnimatedChatMessage>
  );
}
