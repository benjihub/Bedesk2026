import {
  ConversationContentItem,
  ConversationMessage,
  PlaceholderConversationMessage,
} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {auth} from '@common/auth/use-auth';
import {FileEntry} from '@common/uploads/file-entry';
import {getCurrentDateTime} from '@ui/i18n/use-current-date-time';
import {nanoid} from 'nanoid';

export function createPlaceholderMessage(value: {
  uuid?: string | null;
  body: string;
  conversation_id?: number;
  type?: PlaceholderConversationMessage['type'];
  is_streaming?: boolean;
  files?: FileEntry[];
  author?: ConversationContentItem['author'];
  created_at?: string;
  data?: ConversationMessage['data'];
}): PlaceholderConversationMessage {
  const author = value.author ?? 'user';
  const uuid = value.uuid || nanoid();
  return {
    body: value.body,
    conversation_id: value.conversation_id ?? 0,
    id: uuid,
    uuid: uuid,
    type: value.type ?? 'message',
    created_at: value.created_at ?? getCurrentDateTime().toAbsoluteString(),
    attachments: value.files ?? [],
    user:
      author === 'user' && auth.user
        ? {
            id: auth.user.id,
            name: auth.user.name,
            image: auth.user.image,
          }
        : null,
    author: value.author ?? 'user',
    source: null,
    is_placeholder: true,
    data: value.data,
  };
}
