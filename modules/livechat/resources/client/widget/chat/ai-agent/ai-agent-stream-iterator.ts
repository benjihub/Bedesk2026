import {createPlaceholderMessage} from '@app/dashboard/conversations/agent-reply-composer/placeholder-message';
import {addAnimatingMessage} from '@app/dashboard/conversations/conversation-page/messages/animating-messages';
import {
  ConversationContentItem,
  PlaceholderConversationMessage,
} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {throwAxiosError} from '@common/http/get-axios-error-message';
import {queryClient} from '@common/http/query-client';
import {createIterator} from '@livechat/widget/chat/ai-agent/chat-iterator-helpers';
import {updateMessagesQueryData} from '@livechat/widget/conversation-screen/requests/update-messages-query-data';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {InfiniteData} from '@tanstack/react-query';

export async function* aiAgentStreamIterator(
  response: Response,
  abortController: AbortController,
  conversationId?: string | number,
) {
  if (!response.ok || !response?.body) {
    throwAxiosError();
    return null;
  }

  let streamingMessage: PlaceholderConversationMessage | null = null;

  for await (const item of createIterator(response, abortController)) {
    if (item.event === 'message') {
      if (item.data.type === 'conversationCreated') {
        conversationId = item.data.data.conversation.id;
      }

      if (!conversationId) {
        continue;
      }

      if (item.data.type === 'typing') {
        addTypingMessage(conversationId);
      } else {
        removeTypingMessage(conversationId);
      }

      if (item.data.type === 'formattedHtml') {
        streamingMessage = crupdateStreamingMessage(
          streamingMessage,
          conversationId,
          item.data.content,
        );
      }

      if (item.data.type === 'messageCreated') {
        const message = item.data.message;
        updateMessagesQuery(conversationId, oldData => {
          const newData = oldData.filter(
            m =>
              m.type !== 'streaming' &&
              m.type !== 'typing' &&
              !('isPlaceholder' in m),
          );
          newData.push(message);
          return newData;
        });
      }

      yield item;
    }

    if (item.event === 'debug') {
      console.log(item.data.type, item.data.data);
    }
  }

  // in case there's an error and stream does not complete
  if (conversationId) {
    removeTypingMessage(conversationId);
  }
}

function addTypingMessage(
  conversationId: string | number,
): PlaceholderConversationMessage {
  let message = getMessageQueryData(conversationId).find(
    m => m.type === 'typing',
  );
  if (!message) {
    message = createPlaceholderMessage({
      conversation_id: +conversationId,
      body: '',
      author: 'bot',
      type: 'typing',
    });
    addAnimatingMessage(message.uuid);
    updateMessagesQuery(conversationId, oldData => {
      return [...oldData, message!];
    });
  }

  return message as PlaceholderConversationMessage;
}

function removeTypingMessage(conversationId: string | number) {
  updateMessagesQuery(conversationId, oldData => {
    if (!oldData.find(m => m.type === 'typing')) {
      return oldData;
    }
    return oldData.filter(m => m.type !== 'typing');
  });
}

function updateMessagesQuery(
  conversationId: string | number,
  callback: (oldData: ConversationContentItem[]) => ConversationContentItem[],
) {
  updateMessagesQueryData(
    widgetQueries.conversations.messages(conversationId).queryKey,
    callback,
  );
}

function getMessageQueryData(conversationId: string | number) {
  return (
    queryClient
      .getQueryData<
        InfiniteData<PaginatedBackendResponse<ConversationContentItem>>
      >(widgetQueries.conversations.messages(conversationId).queryKey)
      ?.pages.flatMap(page => page.pagination.data) ?? []
  );
}

function crupdateStreamingMessage(
  message: PlaceholderConversationMessage | null,
  conversationId: string | number,
  content: string,
): PlaceholderConversationMessage {
  if (message) {
    // update body without re-rendering
    message.body = content;

    // update body directly in DOM
    const el = document.querySelector(
      `[data-message-id="${message.id}"] .streaming-message-body`,
    );
    if (el) {
      requestAnimationFrame(() => {
        el.innerHTML = content;
      });
    }
    return message;
  } else {
    const message = createPlaceholderMessage({
      conversation_id: +conversationId,
      body: content,
      author: 'bot',
      type: 'streaming',
      is_streaming: true,
    });
    updateMessagesQuery(conversationId, oldData => {
      return [...oldData, message];
    });
    return message;
  }
}
