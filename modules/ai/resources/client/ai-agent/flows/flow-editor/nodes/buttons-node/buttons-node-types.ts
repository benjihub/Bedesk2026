import {
  BaseStoredNodeData,
  NodeWithMessageData,
} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';

export type ButtonsNodeData = {
  preventTyping?: boolean;
} & NodeWithMessageData;

export type ButtonsItemNodeData = BaseStoredNodeData;
