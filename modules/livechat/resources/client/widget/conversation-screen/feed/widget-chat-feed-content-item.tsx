import {AttributeRenderer} from '@app/attributes/rendering/attribute-renderer';
import {AnimatedChatMessage} from '@app/dashboard/conversations/conversation-page/messages/animated-chat-message';
import {
  ConversationContentItem,
  SubmittedFormDataMessage,
} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {useEventText} from '@app/dashboard/conversations/conversation-page/messages/events/use-event-text';
import {MessageAvatar} from '@app/dashboard/conversations/conversation-page/messages/message-avatar';
import {WidgetCollectDetailsForm} from '@livechat/widget/chat/forms/widget-collect-details-form';
import {TypingIndicator} from '@livechat/widget/conversation-screen/feed/typing-indicator';
import {WidgetCardsMessage} from '@livechat/widget/conversation-screen/feed/widget-cards-message';
import {WidgetChatFeedMessage} from '@livechat/widget/conversation-screen/feed/widget-chat-feed-message';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {Trans} from '@ui/i18n/trans';
import {HelpOutlineIcon} from '@ui/icons/material/HelpOutline';
import {useWidgetBootstrapData} from '@livechat/widget/hooks/use-widget-bootstrap-data';

interface Props {
  message: ConversationContentItem;
  isLastInGroup?: boolean;
  isLast?: boolean;
}
export function WidgetChatFeedContentItem({
  message,
  isLastInGroup = true,
  isLast = true,
}: Props) {
  const {activeConversationData, aiAgent} = useWidgetBootstrapData();
  const widgetAiAgent =
    activeConversationData?.conversation.ai_agent ?? aiAgent ?? null;

  if (message.type === 'event') {
    return <EventItem event={message} />;
  }

  if (message.type === 'submittedFormData') {
    return <SubmittedFormData message={message} />;
  }

  if (message.type === 'collectDetailsForm') {
    return <WidgetCollectDetailsForm message={message} disabled={!isLast} />;
  }

  if (message.type === 'cards') {
    return <WidgetCardsMessage message={message} />;
  }

  if (message.type === 'typing') {
    return (
      <TypingIndicator
        message={message}
        avatar={
          <MessageAvatar message={message} size="sm" aiAgent={widgetAiAgent} />
        }
      />
    );
  }

  if (message.type === 'message' || message.type === 'streaming') {
    return (
      <WidgetChatFeedMessage
        messageId={message.id}
        isLastInGroup={isLastInGroup}
        isLast={isLast}
        avatar={
          message.author !== 'user' ? (
            <MessageAvatar message={message} size="sm" aiAgent={widgetAiAgent} />
          ) : undefined
        }
        message={message}
        align={message.author === 'user' ? 'right' : 'left'}
        color={message.author === 'user' ? 'primary' : 'chip'}
      />
    );
  }

  return null;
}

interface EventItemProps {
  event: ConversationContentItem;
}
function EventItem({event}: EventItemProps) {
  // In the embeddable widget we don't want to show "agent has joined" system
  // messages to the end user — suppress them here.
  if (event.type === 'event' && event.body?.name === 'agent.changed' && event.body?.newAgent) {
    return null;
  }

  const text = useEventText({message: event, variant: 'customer'});
  if (!text) return null;
  return (
    <AnimatedChatMessage
      uuid={event.uuid}
      className="mb-12 text-center text-xs text-muted"
    >
      <Trans {...text} /> -{' '}
      <time className="inline-block whitespace-nowrap">
        <FormattedDate date={event.created_at} preset="time" />
      </time>
    </AnimatedChatMessage>
  );
}

export interface SubmittedFormDataProps {
  message: SubmittedFormDataMessage;
}
function SubmittedFormData({message}: SubmittedFormDataProps) {
  return (
    <AnimatedChatMessage uuid={message.uuid} className="mx-16 my-24">
      <div className="relative top-20 mx-auto h-40 w-40 rounded-full bg-primary p-8 text-on-primary">
        <HelpOutlineIcon className="block" />
      </div>
      <div className="space-y-14 rounded-panel border p-24 text-left text-sm">
        {message.body.attributes.map(attribute => (
          <div key={attribute.key}>
            <div className="mb-2 text-muted">{attribute.name}</div>
            <div>
              <AttributeRenderer attribute={attribute} />
            </div>
          </div>
        ))}
      </div>
    </AnimatedChatMessage>
  );
}
