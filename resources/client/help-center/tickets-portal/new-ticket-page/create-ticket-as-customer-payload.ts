import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';

export interface CreateTicketAsCustomerPayload {
  subject: string;
  email?: string;
  message: {
    body: string;
    attachments: ConversationAttachment[];
  };
  attributes: Record<string, unknown>;
}
