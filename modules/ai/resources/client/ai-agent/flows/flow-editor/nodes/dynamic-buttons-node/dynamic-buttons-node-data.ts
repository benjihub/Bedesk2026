import {NodeWithMessageData} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';
import {MessageButton} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';

export type DynamicButtonsNodeData = {
  listPath: string;
  propertyPath: string;
  preventTyping?: boolean;
  toolId: number;
  button: MessageButton;
} & NodeWithMessageData;
