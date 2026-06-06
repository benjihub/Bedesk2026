import {
  ConversationSoundName,
  playConversationSound,
} from '@app/dashboard/websockets/play-conversation-sound';
import {WebsocketUpdatesNotifier} from '@app/dashboard/websockets/websocket-updates-notifier';
import {getWidgetCustomer} from '@livechat/widget/user/use-widget-customer';
import {widgetStore} from '@livechat/widget/widget-store';

class WidgetWebsocketUpdatesNotifier extends WebsocketUpdatesNotifier {
  protected isCountInWidgetTitle = false;

  protected getSoundSettingsKey(): 'dashboard' | 'widget' {
    return 'widget';
  }

  init() {
    this.initNotifier();
  }

  protected playSound(sound: ConversationSoundName) {
    if (
      sound === 'incomingChat' ||
      sound === 'message' ||
      sound === 'queuedVisitor' ||
      sound === 'newVisitor'
    ) {
      playConversationSound(sound, 'widget');
    }
  }

  protected appIsVisible(): boolean {
    return (
      document.visibilityState === 'visible' &&
      widgetStore().widgetState !== 'closed'
    );
  }

  protected conversationBelongsToUser(conversation: {user_id: number}) {
    return conversation.user_id === getWidgetCustomer().id;
  }

  protected addCountToTitle(count: number) {
    this.isCountInWidgetTitle = true;
    this.notifyLoaderOfChanges('addCountToTitle', count);
  }

  protected isCountInTitle() {
    return this.isCountInWidgetTitle;
  }

  protected removeCountFromTitle() {
    this.isCountInWidgetTitle = false;
    this.notifyLoaderOfChanges('removeCountFromTitle');
  }

  protected notifyLoaderOfChanges(
    action: 'removeCountFromTitle' | 'addCountToTitle',
    count?: number,
  ) {
    window.parent.postMessage(
      {
        source: 'livechat-widget',
        type: 'unseenChats',
        action,
        count,
      },
      '*',
    );
  }
}

export const widgetWebsocketUpdatesNotifier =
  new WidgetWebsocketUpdatesNotifier();
