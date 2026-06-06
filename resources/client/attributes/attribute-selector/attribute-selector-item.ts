export type AttributeSelectorItem = {
  name: string;
  type: AttributeSelectorItemType;
};

export enum AttributeSelectorItemType {
  CollectedData = 'collectedData',
  AiAgentTool = 'aiAgentTool',
  AiAgentSession = 'aiAgentSession',
  User = 'user',
  Conversation = 'conversation',
  PageVisit = 'pageVisit',
}
