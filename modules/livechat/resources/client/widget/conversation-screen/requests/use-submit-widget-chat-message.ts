import {createPlaceholderMessage} from '@app/dashboard/conversations/agent-reply-composer/placeholder-message';
import {addAnimatingMessage} from '@app/dashboard/conversations/conversation-page/messages/animating-messages';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {makeStreamedFetchRequest} from '@common/http/make-streamed-fetch-request';
import {queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {aiAgentStreamIterator} from '@livechat/widget/chat/ai-agent/ai-agent-stream-iterator';
import {updateMessagesQueryData} from '@livechat/widget/conversation-screen/requests/update-messages-query-data';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useMutation} from '@tanstack/react-query';

export interface SubmitChatMessageResponse extends BackendResponse {
  conversation: {id: number};
}

export interface SubmitChatMessagePayload {
  conversationId: number | string;
  message: {
    uuid: string;
    body: string;
    attachments?: {id: number}[];
  };
}

export const submitWidgetChatMessageKey = ['submit-widget-chat-message'];

export function useSubmitWidgetChatMessage() {
  return useMutation({
    mutationKey: submitWidgetChatMessageKey,
    mutationFn: ({message, conversationId}: SubmitChatMessagePayload) => {
      const abortController = new AbortController();
      return makeStreamedFetchRequest(
        `lc/widget/chats/${conversationId}/messages`,
        {
          message: {
            ...message,
            attachments: message.attachments?.map(f => f.id),
          },
        },
        abortController.signal,
      ).then(async r => {
        const iterator = aiAgentStreamIterator(
          r,
          abortController,
          conversationId,
        );
        for await (const item of iterator) {
          // make sure to consume the iterator, otherwise it will not execute
        }
      });
    },
    onMutate: async payload => {
      await queryClient.cancelQueries({
        queryKey: messagesQueryKey(payload.conversationId),
      });

      const previousData = queryClient.getQueryData(
        messagesQueryKey(payload.conversationId),
      );

      addAnimatingMessage(payload.message.uuid);
      updateMessagesQueryData(
        messagesQueryKey(payload.conversationId),
        oldData => [...oldData, createPlaceholderMessage(payload.message)],
      );

      return {previousData};
    },
    onError: (err, payload, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          messagesQueryKey(payload.conversationId),
          context.previousData,
        );
      }
      showHttpErrorToast(err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: widgetQueries.conversations.invalidateKey,
      });
    },
  });
}

function messagesQueryKey(conversationId: number | string) {
  return widgetQueries.conversations.messages(conversationId).queryKey;
}
