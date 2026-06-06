export interface WebsocketConversationEventData {
  id: number;
  status_category: number;
  assignee_id: number | undefined;
  assigned_to: string;
  type: string;
  group_id: number;
  user_id: number;
}

export interface WebsocketConversationEvent {
  event: string;
  messageId?: number;
  messageUuid?: string;
  conversationId?: number;
  author?: 'user' | 'agent' | 'bot' | 'system';
  isTyping?: boolean;
  conversations: WebsocketConversationEventData[];
}
