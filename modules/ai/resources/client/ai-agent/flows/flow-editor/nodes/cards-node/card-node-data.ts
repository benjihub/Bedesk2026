import {NodeWithMessageData} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';
import {CardsMessage} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';

export type CardsNodeData = {
  cards: CardsMessage['body']['items'];
} & NodeWithMessageData;
