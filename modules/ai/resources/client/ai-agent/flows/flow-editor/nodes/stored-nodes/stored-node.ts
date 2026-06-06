import {FlowNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/flow-node';
import {MessageButton} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {FlowNodeType} from '../flow-node-type';

export interface StoredNode<Data extends FlowNodeData = FlowNodeData> {
  id: string;
  parentId: string | 'start';
  type: FlowNodeType;
  data: Data;
}

export type BaseStoredNodeData = {
  name?: string;
} & TemporaryStoredNodeData;

export type NodeWithMessageData = {
  message?: string;
  buttons?: MessageButton[];
  attachmentIds?: number[];
} & BaseStoredNodeData;

export type TemporaryStoredNodeData = {
  parentId: string;
  flowId: string;
};
