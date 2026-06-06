import {StoredNode} from './flow-editor/nodes/stored-nodes/stored-node';

export interface AiAgentFlow {
  id: number;
  group_id?: number | null;
  name: string;
  intent: string | null;
  activation_count: number;
  updated_at: string;
  created_at: string;
  config: AiAgentFlowConfig;
}

export interface AiAgentFlowConfig {
  nodes?: StoredNode[];
}

export interface CustomAttribute {
  name: string;
  defaultValue?: string;
}

export interface FlowAttachment {
  id: number;
  name: string;
  type: string;
  thumbnail?: boolean;
  file_size?: number;
  hash: string;
  file_name: string;
  url?: string;
}
