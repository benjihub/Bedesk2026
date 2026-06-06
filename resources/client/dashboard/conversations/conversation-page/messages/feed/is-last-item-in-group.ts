import {ConversationContentItem} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';

export function isLastItemInGroup(
  index: number,
  current: ConversationContentItem,
  all: ConversationContentItem[],
) {
  const next = all[index + 1];

  if (!next) {
    return {
      isLastInGroup: true,
      isLast: true,
    };
  }

  const isLastInGroup =
    next.author !== current.author || next.type !== current.type;

  return {
    isLastInGroup,
    isLast: index === all.length - 1,
  };
}
