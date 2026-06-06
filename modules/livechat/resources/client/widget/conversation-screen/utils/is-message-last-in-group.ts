import {ConversationContentItem} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';

export function isMessageLastInGroup(
  index: number,
  allMessages: ConversationContentItem[],
): boolean {
  if (index === allMessages.length - 1) {
    return true;
  }

  const nextMessage = allMessages[index + 1];
  return (
    nextMessage.author !== allMessages[index].author ||
    // only messages show avatar, so make sure other content item types don't hide it
    nextMessage.type !== 'message'
  );
}
