import {queryClient} from '@common/http/query-client';
import {getWidgetBootstrapData} from '@livechat/widget/hooks/use-widget-bootstrap-data';
import {UseWidgetCustomerResponse} from '@livechat/widget/user/use-widget-customer';
import {widgetWebsocketUpdatesNotifier} from '@livechat/widget/websockets/widget-websocket-updates-notifier';
import {
  setWidgetConversationQueryData,
  widgetQueries,
} from '@livechat/widget/widget-queries';
import {widgetStore} from '@livechat/widget/widget-store';

let alreadyHydrated = false;
export function hydrateWidgetQueryCacheWithInitialData() {
  if (alreadyHydrated) return;

  const data = getWidgetBootstrapData();

  if (data.activeConversationData?.conversation) {
    widgetStore().setActiveConversationId(
      data.activeConversationData.conversation.id,
    );
    window.parent.postMessage(
      {
        source: 'livechat-widget',
        type: 'activeConversationChanged',
        conversationId: data.activeConversationData.conversation.id,
      },
      '*',
    );
    setWidgetConversationQueryData(
      data.activeConversationData.conversation.id,
      data.activeConversationData,
    );
  }

  queryClient.setQueryData<UseWidgetCustomerResponse>(
    widgetQueries.customers.get().queryKey,
    {
      user: data.user,
    },
  );

  widgetWebsocketUpdatesNotifier.init();

  alreadyHydrated = true;
}
