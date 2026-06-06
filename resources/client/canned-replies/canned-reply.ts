import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';

export interface CannedReply {
  id: number;
  name: string;
  shortcut?: string | null;
  description: string;
  body: string;
  shared: boolean;
  group_id: number;
  attachments: ConversationAttachment[];
  updated_at?: string;
  tags: {
    id: number;
    name: string;
  }[];
  user: {
    id: number;
    name: string;
    image: string;
  } | null;
}
