import {BaseStoredNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';
import {CardsMessage} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';

export type DynamicCardsNodeData = {
  listPath: string;
  preventTyping?: boolean;
  message?: string;
  attachmentIds?: string[];
  card: CardsMessage['body']['items'][number];
  toolId: number;
} & BaseStoredNodeData;
