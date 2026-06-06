import {BaseStoredNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';

export type GoToFlowNodeData = {
  targetFlowId: number;
} & BaseStoredNodeData;
