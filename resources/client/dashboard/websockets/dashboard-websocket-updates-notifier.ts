import {CompactAgent} from '@app/dashboard/types/agent';
import {
  ConversationSoundName,
  playConversationSound,
} from '@app/dashboard/websockets/play-conversation-sound';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {WebsocketUpdatesNotifier} from '@app/dashboard/websockets/websocket-updates-notifier';
import {auth} from '@common/auth/use-auth';
import {queryClient} from '@common/http/query-client';

class DashboardWebsocketUpdatesNotifier extends WebsocketUpdatesNotifier {
  protected groupIds: number[] = [];

  init(agent: CompactAgent) {
    this.groupIds = agent.groups.map(g => g.id);
    this.initNotifier();
  }

  protected playSound(sound: ConversationSoundName) {
    playConversationSound(sound, 'dashboard');
  }

  protected shouldRepeatPing(
    sound: ConversationSoundName,
    _conversation: {id: number; assignee_id?: number; group_id: number; user_id: number},
  ): boolean {
    // Repeat only for human-support activation style events.
    return sound === 'incomingChat' || sound === 'queuedVisitor';
  }

  protected async getRepeatPingMaxDurationMs(
    _sound: ConversationSoundName,
    conversation: {id: number; assignee_id?: number; group_id: number; user_id: number},
  ): Promise<number | null> {
    // Group setting: settings.humanSupportPingRepeatMaxSeconds
    // null/undefined => default 60s
    // 0 => unlimited until conversation is opened
    try {
      const data = await queryClient.ensureQueryData(
        helpdeskQueries.groupSettings.get(conversation.group_id),
      );
      const raw = (data?.settings as any)?.humanSupportPingRepeatMaxSeconds;
      const seconds =
        typeof raw === 'number'
          ? raw
          : typeof raw === 'string' && raw.trim() !== ''
            ? Number(raw)
            : null;

      if (seconds == null || !Number.isFinite(seconds)) {
        return 60_000;
      }
      if (seconds <= 0) {
        return null;
      }
      return Math.round(seconds * 1000);
    } catch {
      return 60_000;
    }
  }

  protected conversationBelongsToUser(conversation: {
    assignee_id?: number;
    group_id: number;
  }) {
    return (
      conversation.assignee_id === auth.user?.id ||
      (!conversation.assignee_id &&
        this.groupIds.includes(conversation.group_id))
    );
  }

  protected appIsVisible(): boolean {
    return document.visibilityState === 'visible';
  }

  protected addCountToTitle(count: number) {
    if (!this.isCountInTitle()) {
      const prefix = `(${count}) `;
      document.title = prefix + document.title;
    }
  }

  protected isCountInTitle() {
    return /^\(\d+\)\s/.test(document.title);
  }

  protected removeCountFromTitle() {
    document.title = document.title.replace(/^\(\d+\)\s/, '');
  }
}

export const dashboardChatUpdatesNotifier =
  new DashboardWebsocketUpdatesNotifier();
