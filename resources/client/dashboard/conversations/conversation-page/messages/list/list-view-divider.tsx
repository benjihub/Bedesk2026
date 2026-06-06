import {ConversationContentItem} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';

interface Props {
  messages: ConversationContentItem[];
  index: number;
}
export function ListViewDivider({messages, index}: Props) {
  if (messages.length === index + 1) return null;
  return <div className="mx-auto h-1 w-[calc(100%-34px)] w-full bg-divider" />;
}
