import {BaseStoredNodeData} from '@ai/ai-agent/flows/flow-editor/nodes/stored-nodes/stored-node';

export type ToolNodeData = {
  toolId: number;
} & BaseStoredNodeData;

export type ToolResultNodeData = {
  type: 'success' | 'failure';
} & BaseStoredNodeData;
