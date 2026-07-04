import {ConversationContentItem} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {FullWidgetConversationResponse} from '@livechat/widget/conversation-screen//requests/full-widget-conversation-response';
import {WidgetCustomer} from '@livechat/widget/user/widget-customer';
import {
  getBootstrapData,
  useBootstrapDataStore,
} from '@ui/bootstrap-data/bootstrap-data-store';

export interface WidgetBootstrapData {
  activeConversationData?: FullWidgetConversationResponse;
  user: WidgetCustomer;
  aiAgent?: {
    id: number;
    name: string;
    image: string | null;
  } | null;
  scopedHcCategoryId?: number;
  department?: string | null;
  visitorId?: string | null;
  newChatGreeting?: {
    parts: ConversationContentItem[];
    flow_id?: number;
  };
  widgetAuthToken?: string | null;
  // optional CSRF tokens - some bootstrap payloads expose one of these
  csrf_token?: string | null;
  csrfToken?: string | null;
}

export function useWidgetBootstrapData() {
  const {data} = useBootstrapDataStore();
  return data as unknown as WidgetBootstrapData;
}

export function getWidgetBootstrapData() {
  return getBootstrapData() as unknown as WidgetBootstrapData;
}
