import {NodeWithMessageData} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';

export type TransferNodeData = {
  agentId?: string;
  groupId?: string;
} & NodeWithMessageData;
