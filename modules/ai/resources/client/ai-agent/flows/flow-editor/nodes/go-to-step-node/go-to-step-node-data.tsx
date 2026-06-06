import {BaseStoredNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';

export type GoToStepNodeData = {
  targetNodeId: string;
} & BaseStoredNodeData;
