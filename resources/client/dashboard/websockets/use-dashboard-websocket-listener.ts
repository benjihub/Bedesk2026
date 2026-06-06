import {addAnimatingMessage} from '@app/dashboard/conversations/conversation-page/messages/animating-messages';
import {createPlaceholderMessage} from '@app/dashboard/conversations/agent-reply-composer/placeholder-message';
import {helpdeskChannel} from '@app/dashboard/helpdesk-channel';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {dashboardChatUpdatesNotifier} from '@app/dashboard/websockets/dashboard-websocket-updates-notifier';
import {echoStore} from '@app/dashboard/websockets/echo-store';
import {playConversationSound} from '@app/dashboard/websockets/play-conversation-sound';
import {WebsocketConversationEvent} from '@app/dashboard/websockets/websocket-conversation-event';
import {useAuth} from '@common/auth/use-auth';
import {EMPTY_PAGINATION_RESPONSE} from '@common/http/backend-response/pagination-response';
import {queryClient} from '@common/http/query-client';
import {useEffect, useRef} from 'react';
import {useDebouncedCallback} from 'use-debounce';

export function useDashboardWebsocketListener() {
  const {user} = useAuth();
  const currentUserId = user?.id ?? null;

  // make sure there are no duplicate requests if multiple similar
  // events are fired in a short time by debouncing handlers
  const invalidateConversationsQueries = useDebouncedCallback(
    () => {
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.conversations.invalidateKey,
        // refetch even if queries are currently inactive
        refetchType: 'all',
      });
    },
    500,
    {leading: true, trailing: true},
  );

  const invalidateAgentsQueries = useDebouncedCallback(
    () => {
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.agents.invalidateKey,
        refetchType: 'all',
      });
    },
    500,
    {leading: true, trailing: true},
  );

  const handleUserCreatedEvent = useDebouncedCallback(
    () => {
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.customers.invalidateKey,
      });
      playConversationSound('newVisitor', 'dashboard');
    },
    10000,
    {leading: true},
  );

  const invalidatePageVisitQueries = useDebouncedCallback(e => {
    queryClient.invalidateQueries({
      queryKey: helpdeskQueries.pageVisits.invalidateKey,
    });
  }, 500);

  useListener<WebsocketConversationEvent>(
    [
      helpdeskChannel.events.conversations.created,
      helpdeskChannel.events.conversations.updated,
      helpdeskChannel.events.conversations.newMessage,
      helpdeskChannel.events.conversations.typing,
    ],
    async e => {
      if (e.event === helpdeskChannel.events.conversations.typing) {
        handleTypingEvent(e);
        return;
      }

      if (e.messageUuid) {
        addAnimatingMessage(e.messageUuid);
      }

// If this is not a new message event and the conversations are handled
  // exclusively by the AI agent/flows, ignore the event. For new message
  // events we still need to refetch messages so agents see bot messages
  // sent *before* any escalation.
  if (
    e.event !== helpdeskChannel.events.conversations.newMessage &&
    e.conversations.every(c => c.assigned_to === 'bot')
  ) {
        return;
      }

      // invalidate queries when conversation is created or updated or
      // when there's a new message for conversation assigned to this agent
      if (
        e.event !== helpdeskChannel.events.conversations.newMessage ||
        e.conversations.every(c => c.assignee_id === currentUserId)
      ) {
        invalidateConversationsQueries();
      }

      if (e.event === helpdeskChannel.events.conversations.newMessage) {
        // ensure messages for this conversation are refetched so the agent
        // immediately sees new messages — even if they were sent by the bot
        // before the handoff/escalation occurred
        queryClient.invalidateQueries({
          queryKey: helpdeskQueries.conversations.messages(e.conversations[0].id)
            .queryKey,
          // always refetch even if the query isn't active to ensure state is in sync
          refetchType: 'all',
        });

        removeTypingMessage(e.conversations[0].id, 'user');
      }

      // If this is an update (not a new message):
      // - refetch messages when a conversation becomes assigned to an agent
      // - ALSO refetch when the handoff is introduced (e.g., `need-human-support` tag)
      // The event payload may include `tags` or `ai_agent_session` info; check defensively.
      if (e.event !== helpdeskChannel.events.conversations.newMessage) {
        try {
          for (const c of e.conversations ?? []) {
            if (!c || !c.id) continue;

            const hasSupportTag = Array.isArray((c as any).tags)
              ? (c as any).tags.some(
                  (t: any) => (t && (t.name || t) === 'need-human-support'),
                )
              : false;

            const aiSession = (c as any).ai_agent_session;
            const hasAiHandoffFlag = !!(
              aiSession && aiSession.context && aiSession.context.support_handoff_active
            );

            if (c.assigned_to === 'agent' || hasSupportTag || hasAiHandoffFlag) {
              queryClient.invalidateQueries({
                queryKey: helpdeskQueries.conversations.messages(c.id).queryKey,
                refetchType: 'all',
              });
            }
          }
        } catch (err) {
          // best-effort only
          // eslint-disable-next-line no-console
          console.warn('Failed to refetch messages on conversation update', err);
        }
      }

      dashboardChatUpdatesNotifier.handleEvent(e);
    },
  );

  // invalidate agent queries when any relevant event occurs
  useListener([helpdeskChannel.events.agents.updated], invalidateAgentsQueries);

  // invalidate customer queries when any relevant event occurs
  useListener([helpdeskChannel.events.users.created], handleUserCreatedEvent);

  // invalidate visits queries when any relevant event occurs
  useListener(
    [helpdeskChannel.events.users.pageVisitCreated],
    invalidatePageVisitQueries,
  );
}

function useListener<T>(events: string[], callback: (e: T) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return echoStore().listen<WebsocketConversationEvent>({
      channel: helpdeskChannel.name,
      events,
      type: 'presence',
      callback: e => {
        callbackRef.current(e as T);
      },
    });
    // events are ignored on purpose, they will never change
  }, []);
}

function handleTypingEvent(e: WebsocketConversationEvent) {
  const conversationId = e.conversationId ?? e.conversations?.[0]?.id;
  if (!conversationId || e.author !== 'user') return;

  if (e.isTyping) {
    addTypingMessage(conversationId, 'user');
  } else {
    removeTypingMessage(conversationId, 'user');
  }
}

function addTypingMessage(conversationId: number, author: 'user') {
  updateDashboardMessagesQueryData(
    helpdeskQueries.conversations.messages(conversationId).queryKey,
    oldData => {
      const exists = oldData.some(
        m => m.type === 'typing' && m.author === author,
      );
      if (exists) return oldData;
      const typingMessage = createPlaceholderMessage({
        conversation_id: conversationId,
        body: '',
        type: 'typing',
        author,
      });
      return [...oldData, typingMessage];
    },
  );
}

function removeTypingMessage(conversationId: number, author: 'user') {
  updateDashboardMessagesQueryData(
    helpdeskQueries.conversations.messages(conversationId).queryKey,
    oldData => oldData.filter(m => !(m.type === 'typing' && m.author === author)),
  );
}

function updateDashboardMessagesQueryData(
  queryKey: unknown[],
  callback: (oldData: any[]) => any[],
) {
  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) {
      old = {
        pages: [EMPTY_PAGINATION_RESPONSE],
        pageParams: [],
      };
    }

    const oldPages = old.pages ?? [EMPTY_PAGINATION_RESPONSE];
    const firstPage = oldPages[0] ?? EMPTY_PAGINATION_RESPONSE;
    const oldData = firstPage?.pagination?.data ?? [];

    const newData = callback(oldData);

    const newFirstPage = {
      ...firstPage,
      pagination: {
        ...(firstPage?.pagination ?? {}),
        data: [...newData],
      },
    };

    return {
      ...old,
      pages: [newFirstPage, ...oldPages.slice(1)],
    };
  });
}
