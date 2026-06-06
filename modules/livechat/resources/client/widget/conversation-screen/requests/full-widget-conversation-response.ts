import {CompactAttribute} from '@app/attributes/compact-attribute';
import {ConversationContentItem} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {CursorPaginationResponse} from '@common/http/backend-response/pagination-response';

export interface FullWidgetConversationResponse {
  conversation: {
    id: number;
    status_category: number;
    status: string;
    priority: number;
    updated_at: string;
    created_at: string;
    type: 'ticket' | 'chat';
    assigned_to: 'agent' | 'bot';
    subject: string | null;
    user: {
      id: number;
      name: string;
      image: string;
    } | null;
    assignee: {
      id: number;
      name: string;
      image: string;
    } | null;
  };
  items: CursorPaginationResponse<ConversationContentItem>;
  hasPostChatForm: boolean;
  queuedChatInfo?: {
    positionInQueue: number;
    estimatedWaitTime: number;
  };
  attributes: {
    key: string;
    name: string;
    format: CompactAttribute['format'];
    value: unknown;
  }[];
}
