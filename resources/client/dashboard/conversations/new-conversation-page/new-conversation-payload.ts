import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';

export interface NewConversationPayload {
  type: 'ticket' | 'chat';
  user_id: number;
  status_id: number;
  subject?: string;
  message: {
    body: string;
    attachments: ConversationAttachment[];
  };
  attributes: Record<string, unknown>;
}
