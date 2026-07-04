export interface AiAgentSettings {
  name: string;
  enabled: boolean;
  personality: string;
  greetingType: 'flow' | 'basicGreeting';
  initialFlowId?: number;
  basicGreeting?: {
    message?: string;
    flowIds?: number[];
  };
  transfer?: {
    type: 'basicTransfer' | 'instruction';
    instruction?: string;
  };
  cantAssist?: {
    instruction?: string;
  };
}
