import {addAnimatingMessage} from '@app/dashboard/conversations/conversation-page/messages/animating-messages';
import {createPlaceholderMessage} from '@app/dashboard/conversations/agent-reply-composer/placeholder-message';
import {helpdeskChannel} from '@app/dashboard/helpdesk-channel';
import {statusCategory} from '@app/dashboard/statuses/status-category';
import {echoStore} from '@app/dashboard/websockets/echo-store';
import {WebsocketConversationEvent} from '@app/dashboard/websockets/websocket-conversation-event';
import {updateMessagesQueryData} from '@livechat/widget/conversation-screen/requests/update-messages-query-data';
import {queryClient} from '@common/http/query-client';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useWidgetCustomer} from '@livechat/widget/user/use-widget-customer';
import {widgetWebsocketUpdatesNotifier} from '@livechat/widget/websockets/widget-websocket-updates-notifier';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {widgetStore} from '@livechat/widget/widget-store';
import {useEffect, useRef} from 'react';
import {useMatch} from 'react-router';
import {useDebouncedCallback} from 'use-debounce';

export function useWidgetWebsocketListener() {
  const navigate = useNavigate();
  const customer = useWidgetCustomer();
  const match = useMatch('/conversations/:conversationId');
  const conversationId = match?.params.conversationId
    ? +match.params.conversationId
    : null;

  // make sure there are no duplicate requests if multiple similar
  // events are fired in a short time by debouncing handlers
  const invalidateChatQueries = useDebouncedCallback(() => {
    queryClient.invalidateQueries({
      queryKey: widgetQueries.conversations.invalidateKey,
    });
  }, 500);

  useListener<WebsocketConversationEvent>(
    [
      helpdeskChannel.events.conversations.created,
      helpdeskChannel.events.conversations.updated,
      helpdeskChannel.events.conversations.newMessage,
      helpdeskChannel.events.conversations.typing,
    ],
    customer?.id ?? null,
    e => {
      // DEV debug: print raw websocket events when enabled
    if ((window as any).__LC_DEBUG_WS__) {
      // eslint-disable-next-line no-console
      console.debug('[livechat widget] ws event received', e);
    }

    widgetWebsocketUpdatesNotifier.handleEvent(e);

    if (e.event === helpdeskChannel.events.conversations.typing) {
      handleTypingEvent(e);
      return;
    }

      if (e.messageUuid) {
        addAnimatingMessage(e.messageUuid);
      }

      // clear active chat id, if chat was closed
      const activeChatId = widgetStore().activeConversationId;
      if (
        activeChatId &&
        e.conversations.some(
          c =>
            c.id === activeChatId && c.status_category <= statusCategory.closed,
        )
      ) {
        widgetStore().setActiveConversationId(null);
      }

      // invalidate chat queries when chat is created or updated
      if (e.event !== helpdeskChannel.events.conversations.newMessage) {
        invalidateChatQueries();
      }

      // invalidate chat messages query when new message is received
      if (e.event === helpdeskChannel.events.conversations.newMessage) {
        queryClient.invalidateQueries({
          queryKey: widgetQueries.conversations.messages(e.conversations[0].id)
            .queryKey,
          // always refetch messages, even if that query is not used currently
          refetchType: 'all',
        });

        // clear typing indicator when a message arrives
        removeTypingMessage(e.conversations[0].id, 'agent');
      }

      // open chat page when chat is opened by agent
      if (e.event === helpdeskChannel.events.conversations.created) {
        if (
          e.conversations.some(c => c.status_category >= statusCategory.open) &&
          e.conversations.some(c => c.type === 'chat')
        ) {
          // if not already on chat page, navigate to new chat
          if (conversationId !== e.conversations[0].id) {
            navigate(`/conversations/${e.conversations[0].id}`);
          }
        }
      }
    },
  );
}

function useListener<T>(
  events: string[],
  customerId: number | null,
  callback: (e: T) => void,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!customerId) return;
    return echoStore().listen<WebsocketConversationEvent>({
      channel: helpdeskChannel.name,
      events,
      type: 'presence',
      callback: e => {
        if (e.conversations.every(c => c.user_id === customerId)) {
          callbackRef.current(e as T);
        }
      },
    });
    // events are ignored on purpose, they will never change
  }, [customerId]);
}

function handleTypingEvent(e: WebsocketConversationEvent) {
  const conversationId = e.conversationId ?? e.conversations?.[0]?.id;
  const author = (e.author ?? 'agent') as WebsocketConversationEvent['author'];
  const isTyping =
    (e as any).isTyping ??
    // tolerate snake_case payloads
    (e as any).is_typing;

  if ((window as any).__LC_DEBUG_WS__) {
    // eslint-disable-next-line no-console
    console.debug('[livechat widget] typing event', {
      conversationId,
      author,
      isTyping,
      raw: e,
    });
  }

  // Widget only cares about non-user typing (agent/bot/system etc).
  if (!conversationId || author === 'user') return;

  if (isTyping) {
    addTypingMessage(conversationId, (author === 'bot' ? 'bot' : 'agent') as any);
  } else {
    removeTypingMessage(conversationId, (author === 'bot' ? 'bot' : 'agent') as any);
  }
}

function addTypingMessage(conversationId: number, author: 'agent' | 'bot') {
  updateMessagesQueryData(
    widgetQueries.conversations.messages(conversationId).queryKey,
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

function removeTypingMessage(conversationId: number, author: 'agent' | 'bot') {
  updateMessagesQueryData(
    widgetQueries.conversations.messages(conversationId).queryKey,
    oldData => oldData.filter(m => !(m.type === 'typing' && m.author === author)),
  );
}
