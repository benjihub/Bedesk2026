import {CompactAttribute} from '@app/attributes/compact-attribute';
import {FullConversationResponse} from '@app/dashboard/conversation';

export interface TicketsPortalConversationResponse {
  conversation: {
    id: number;
    subject: string | null;
    status: string;
    priority: number;
    status_category: FullConversationResponse['conversation']['status_category'];
    assignee: FullConversationResponse['conversation']['assignee'] | null;
    user: {
      id: number;
      name: string;
      image: string;
    } | null;
    updated_at: string;
    created_at: string;
  };
  attributes: {
    key: string;
    name: string;
    format: CompactAttribute['format'];
    value: unknown;
  }[];
}
