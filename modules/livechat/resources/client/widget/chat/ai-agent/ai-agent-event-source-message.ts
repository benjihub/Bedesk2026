import {ConversationMessage} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {FullWidgetConversationResponse} from '@livechat/widget/conversation-screen/requests/full-widget-conversation-response';

export type AiAgentIteratorItem =
  | MessageItem
  | DeltaItem
  | DebugItem
  | StreamEndItem
  | StreamEndDeltaItem;

export interface StreamEndItem {
  event: 'message';
  data: {
    type: 'endStream';
    value: '[END]';
  };
}

export interface StreamEndDeltaItem {
  event: 'message';
  data: {
    type: 'endDeltaStream';
    value: '[END_DELTA]';
  };
}

export interface DeltaItem {
  event: 'delta';
  data: {
    delta: string;
  };
}

export interface DebugItem {
  event: 'debug';
  data: {
    type: string;
    data: unknown;
  };
}

export type MessageItem =
  | FormattedHtmlItem
  | CreatedMessageItem
  | CreatedConversationItem
  | TypingItem;

export interface TypingItem {
  event: 'message';
  data: {
    type: 'typing';
  };
}

export interface FormattedHtmlItem {
  event: 'message';
  data: {
    type: 'formattedHtml';
    content: string;
  };
}

interface CreatedMessageItem {
  event: 'message';
  data: {
    type: 'messageCreated';
    message: ConversationMessage;
  };
}

interface CreatedConversationItem {
  event: 'message';
  data: {
    type: 'conversationCreated';
    data: FullWidgetConversationResponse;
  };
}
