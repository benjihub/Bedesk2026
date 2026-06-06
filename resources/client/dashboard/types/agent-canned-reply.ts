import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {SimplePaginationResponse} from '@common/http/backend-response/pagination-response';

export interface AgentCannedRepliesResponse {
  pagination: SimplePaginationResponse<AgentCannedReply>;
}

export interface AgentCannedReply {
  id: number;
  name: string;
  shortcut?: string | null;
  description: string;
  body: string;
  attachments: ConversationAttachment[];
  tags: {
    id: number;
    name: string;
  }[];
}
