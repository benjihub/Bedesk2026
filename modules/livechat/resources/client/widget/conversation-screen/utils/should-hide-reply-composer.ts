import {ConversationContentItem} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {getWidgetBootstrapData} from '@livechat/widget/hooks/use-widget-bootstrap-data';

export function shouldHideReplyComposer(
  messages: ConversationContentItem[] | undefined,
): boolean {
  if (messages == null) {
    return false;
  }

  if (messages.length === 0) {
    messages = getWidgetBootstrapData().newChatGreeting?.parts ?? [];
  }

  const lastMessage = messages.at(-1);

  const lastMessageIsForm = lastMessage?.type === 'collectDetailsForm';

  const lastMessagePreventsTyping =
    lastMessage?.type === 'message' && !!lastMessage.data?.preventTyping;

  return lastMessageIsForm || lastMessagePreventsTyping;
}
