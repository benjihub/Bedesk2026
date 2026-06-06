import {helpdeskChannel} from '@app/dashboard/helpdesk-channel';
import {ConversationSoundName} from '@app/dashboard/websockets/play-conversation-sound';
import {WebsocketConversationEvent} from '@app/dashboard/websockets/websocket-conversation-event';
import {create} from 'zustand';
import {statusCategory} from '../statuses/status-category';

export const useUnseenConversationsStore = create<{
  unseenConversations: number[];
  conversationsWithUnseenMessages: number[];
  setData: (
    unseenConversations: number[],
    conversationsWithUnseenMessages: number[],
  ) => void;
}>()(set => ({
  unseenConversations: [],
  conversationsWithUnseenMessages: [],
  setData: (unseenConversations, conversationsWithUnseenMessages) => {
    set({
      unseenConversations,
      conversationsWithUnseenMessages,
    });
  },
}));

export abstract class WebsocketUpdatesNotifier {
  protected intervalId: ReturnType<typeof setInterval> | null = null;

  protected repeatingPing: {
    conversationId: number;
    sound: ConversationSoundName;
    intervalId: ReturnType<typeof setInterval>;
  } | null = null;
  protected repeatPingCandidates = new Map<
    number,
    {
      sound: ConversationSoundName;
      groupId: number;
      startedAt: number;
      stopAt: number | null;
    }
  >();

  protected unseenConversations: Record<
    number,
    {unseen: boolean; unseenMessages: boolean}
  > = {};

  protected lastConversationRouting = new Map<
    number,
    {assigneeId: number | null; groupId: number}
  >();
  protected addUnseenConversation(d: {
    id: number;
    unseen: boolean;
    unseenMessages: boolean;
  }) {
    if (d.unseen || d.unseenMessages) {
      this.unseenConversations[d.id] = d;
    } else {
      this.removeUnseenConversation(d.id);
    }
  }
  protected removeUnseenConversation(id: number) {
    delete this.unseenConversations[id];
    this.removeRepeatingPingCandidate(id);
    this.lastConversationRouting.delete(id);
  }

  protected abstract conversationBelongsToUser(conversation: {
    assignee_id?: number;
    group_id: number;
    user_id: number;
  }): boolean;
  protected abstract addCountToTitle(count: number): void;
  protected abstract isCountInTitle(): boolean;
  protected abstract removeCountFromTitle(): void;
  protected abstract appIsVisible(): boolean;
  protected abstract playSound(sound: ConversationSoundName): void;

  // Override in subclasses to enable repeating for specific sounds.
  // e.g. dashboard can repeat for queued visitors / incoming chats.
  protected shouldRepeatPing(
    _sound: ConversationSoundName,
    _conversation: {id: number; assignee_id?: number; group_id: number; user_id: number},
  ): boolean {
    return false;
  }

  // Repeat interval between pings.
  protected getRepeatPingIntervalMs(
    _sound: ConversationSoundName,
    _conversation: {id: number; assignee_id?: number; group_id: number; user_id: number},
  ): number {
    return 5000;
  }

  // Max duration to keep repeating after activation.
  // Return null (or <= 0) for unlimited; return a number in ms otherwise.
  // Default is 60 seconds.
  protected getRepeatPingMaxDurationMs(
    _sound: ConversationSoundName,
    _conversation: {id: number; assignee_id?: number; group_id: number; user_id: number},
  ): number | null | Promise<number | null> {
    return 60_000;
  }

  protected pageStatus = {
    isInboxOpen: false,
    activeConversationId: null as number | null,
  };

  setPageStatus(status: WebsocketUpdatesNotifier['pageStatus']) {
    this.pageStatus = {...this.pageStatus, ...status};
    this.onConversationPageOpenOrDocumentVisibilityChange();
    this.syncRepeatingPing();
  }

  // mark conversation as seen if we are on inbox page or specified conversation page is open
  protected shouldMarkConversationAsSeen(conversation: {id: number}) {
    return (
      this.appIsVisible() &&
      (this.pageStatus.isInboxOpen ||
        this.pageStatus.activeConversationId === conversation.id)
    );
  }

  // mark messages as seen only if we are on that specific conversation's page and app is visible
  protected shouldMarkMessagesAsSeen(conversation: {id: number}): boolean {
    return (
      this.appIsVisible() &&
      conversation.id === this.pageStatus.activeConversationId
    );
  }

  // play sound if app is not visible or if there's a new
  // conversation or a new message for conversation that is currently not active
  protected shouldPlaySound(conversationId: number) {
    return (
      !this.appIsVisible() ||
      this.pageStatus.activeConversationId !== conversationId
    );
  }

  protected onConversationPageOpenOrDocumentVisibilityChange() {
    if (document.visibilityState === 'hidden') return;

    if (this.pageStatus.isInboxOpen) {
      this.markConversationsAsSeen();
    }

    // if we are on specific conversation page, mark messages of that conversation as seen
    if (this.pageStatus.activeConversationId) {
      this.markMessagesAsSeen([this.pageStatus.activeConversationId]);
    }
  }

  markConversationsAsSeen(conversationIds?: number[]) {
    const conversationsToMark =
      conversationIds || Object.keys(this.unseenConversations).map(Number);

    conversationsToMark.forEach(id => {
      this.unseenConversations[id].unseen = false;
    });

    this.syncWithStore();
    this.maybeStopTitleInterval();
    this.syncRepeatingPing();
  }

  markMessagesAsSeen(conversationIds?: number[]) {
    const conversationsToMark =
      conversationIds || Object.keys(this.unseenConversations).map(Number);

    conversationsToMark.forEach(id => {
      if (this.unseenConversations[id]) {
        this.unseenConversations[id].unseenMessages = false;
      }
    });

    this.syncWithStore();
    this.maybeStopTitleInterval();
    this.syncRepeatingPing();
  }

  protected queueRepeatingPing(
    sound: ConversationSoundName,
    conversation: {id: number; assignee_id?: number; group_id: number; user_id: number},
  ) {
    if (!this.shouldRepeatPing(sound, conversation)) return;

    // Only repeat if it's not the currently open conversation.
    if (this.pageStatus.activeConversationId === conversation.id) return;

    const now = Date.now();
    if (!this.repeatPingCandidates.has(conversation.id)) {
      this.repeatPingCandidates.set(conversation.id, {
        sound,
        groupId: conversation.group_id,
        startedAt: now,
        stopAt: null,
      });

      void Promise.resolve(
        this.getRepeatPingMaxDurationMs(sound, conversation),
      ).then(maxDurationMs => {
        const candidate = this.repeatPingCandidates.get(conversation.id);
        if (!candidate) return;
        if (maxDurationMs == null || !Number.isFinite(maxDurationMs) || maxDurationMs <= 0) {
          candidate.stopAt = null;
        } else {
          candidate.stopAt = candidate.startedAt + maxDurationMs;
        }
        this.syncRepeatingPing();
      });
    }

    this.syncRepeatingPing();
  }

  protected removeRepeatingPingCandidate(conversationId: number) {
    this.repeatPingCandidates.delete(conversationId);
  }

  protected stopRepeatingPing() {
    if (this.repeatingPing) {
      clearInterval(this.repeatingPing.intervalId);
      this.repeatingPing = null;
    }
  }

  protected syncRepeatingPing() {
    const now = Date.now();

    // Remove candidates that are no longer unseen or already opened.
    for (const [conversationId, candidate] of this.repeatPingCandidates) {
      const unseen = this.unseenConversations[conversationId]?.unseen;
      const isOpen = this.pageStatus.activeConversationId === conversationId;
      const expired = candidate.stopAt != null && now >= candidate.stopAt;

      if (!unseen || isOpen || expired) {
        this.repeatPingCandidates.delete(conversationId);
      }
    }

    // If current repeating ping is no longer valid, stop it.
    if (this.repeatingPing) {
      const stillCandidate = this.repeatPingCandidates.has(
        this.repeatingPing.conversationId,
      );
      if (!stillCandidate) {
        this.stopRepeatingPing();
      }
    }

    // Start repeating for the newest candidate.
    if (!this.repeatingPing && this.repeatPingCandidates.size) {
      const newest = Array.from(this.repeatPingCandidates.entries()).sort(
        (a, b) => b[1].startedAt - a[1].startedAt,
      )[0];
      if (!newest) return;
      const [conversationId, candidate] = newest;

      // Safety: only repeat while conversation is still unseen.
      if (!this.unseenConversations[conversationId]?.unseen) {
        this.repeatPingCandidates.delete(conversationId);
        return;
      }

      // Play immediately, then repeat.
      this.playSound(candidate.sound);

      const intervalMs = Math.max(1000, this.getRepeatPingIntervalMs(candidate.sound, {
        id: conversationId,
        group_id: candidate.groupId,
        user_id: 0,
      } as any));

      const intervalId = setInterval(() => {
        const current = this.repeatPingCandidates.get(conversationId);
        const stillUnseen = this.unseenConversations[conversationId]?.unseen;
        const isOpen = this.pageStatus.activeConversationId === conversationId;
        const expired = current?.stopAt != null && Date.now() >= (current.stopAt as number);
        if (!current || !stillUnseen || isOpen || expired) {
          this.repeatPingCandidates.delete(conversationId);
          this.syncRepeatingPing();
          return;
        }
        this.playSound(current.sound);
      }, intervalMs);

      this.repeatingPing = {
        conversationId,
        sound: candidate.sound,
        intervalId,
      };
    }
  }

  // this is called whenever conversation create, update or newMessage event is received via websockets
  handleEvent(e: WebsocketConversationEvent) {
    if (
      e.event === helpdeskChannel.events.conversations.created ||
      e.event === helpdeskChannel.events.conversations.updated
    ) {
      e.conversations.forEach(conversation => {
        // if conversation does not belong to user, remove it and continue.
        // might happen if conversation is assigned to agent and then unassigned.
        if (
          !this.conversationBelongsToUser(conversation) ||
          conversation.status_category <= statusCategory.closed
        ) {
          this.removeUnseenConversation(conversation.id);
          return;
        }

        const prev = this.lastConversationRouting.get(conversation.id) ?? null;
        const nextRouting = {
          assigneeId: conversation.assignee_id ?? null,
          groupId: conversation.group_id,
        };
        this.lastConversationRouting.set(conversation.id, nextRouting);

        const prevUnseen = this.unseenConversations[conversation.id]?.unseen ?? false;
        const nextUnseen = !this.shouldMarkConversationAsSeen(conversation);
        const nextUnseenMessages = !this.shouldMarkMessagesAsSeen(conversation);

        this.addUnseenConversation({
          id: conversation.id,
          unseen: nextUnseen,
          unseenMessages: nextUnseenMessages,
        });

        // Notify on:
        // - brand new tracked conversation
        // - conversation became unseen again
        // - routing changed (assigned/unassigned), which is typical for "human support activated"
        const isNewlyTracked = prev === null;
        const becameUnseen = !prevUnseen && nextUnseen;
        const routingChanged =
          !!prev &&
          (prev.assigneeId !== nextRouting.assigneeId ||
            prev.groupId !== nextRouting.groupId);

        const shouldNotify = (isNewlyTracked || becameUnseen || routingChanged) && nextUnseen;

        if (shouldNotify && this.shouldPlaySound(conversation.id)) {
          if (!conversation.assignee_id) {
            this.playSound('queuedVisitor');
            this.queueRepeatingPing('queuedVisitor', conversation);
          } else {
            this.playSound('incomingChat');
            this.queueRepeatingPing('incomingChat', conversation);
          }
        }
      });
    }

    if (e.event === helpdeskChannel.events.conversations.newMessage) {
      const seenAllMessages = this.shouldMarkMessagesAsSeen(e.conversations[0]);
      if (!seenAllMessages) {
        // needed to show dot in conversation list, when new message arrives while not in inbox
        this.addUnseenConversation({
          id: e.conversations[0].id,
          unseen: !this.shouldMarkConversationAsSeen(e.conversations[0]),
          unseenMessages: !this.shouldMarkMessagesAsSeen(e.conversations[0]),
        });

        // play new message sound only if browser tab is not focused or not on conversation page
        this.playSound('message');
      }
    }

    this.syncWithStore();
    this.syncTitleInterval();
    this.syncRepeatingPing();
  }

  // stop interval if no unseen conversations/messages, start new interval, or update count in current interval
  protected syncTitleInterval() {
    this.maybeStopTitleInterval();
    // if app is visible, only count unseen conversations, otherwise count unseen messages as well
    const unseenCount = Object.entries(this.unseenConversations).filter(
      ([, {unseen, unseenMessages}]) =>
        unseen || (!this.appIsVisible() && unseenMessages),
    ).length;
    if (unseenCount > 0) {
      this.maybeStopTitleInterval({force: true});
      this.intervalId = setInterval(() => {
        if (!this.isCountInTitle()) {
          this.addCountToTitle(unseenCount);
        } else {
          this.removeCountFromTitle();
        }
      }, 1000);
    }
  }

  protected syncWithStore() {
    useUnseenConversationsStore.getState().setData(
      Object.entries(this.unseenConversations)
        .filter(([, {unseen}]) => unseen)
        .map(([id]) => Number(id)),
      Object.entries(this.unseenConversations)
        .filter(([, {unseenMessages}]) => unseenMessages)
        .map(([id]) => Number(id)),
    );
  }

  protected maybeStopTitleInterval({force}: {force?: boolean} = {}) {
    // only run title interval if conversation itself is unseen and not just its messages
    if (
      force ||
      Object.entries(this.unseenConversations).every(([, {unseen}]) => !unseen)
    ) {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.removeCountFromTitle();
    }
  }

  isInitialized = false;
  protected initNotifier() {
    document.addEventListener('visibilitychange', () => {
      this.onConversationPageOpenOrDocumentVisibilityChange();
    });

    this.isInitialized = true;
  }
}
