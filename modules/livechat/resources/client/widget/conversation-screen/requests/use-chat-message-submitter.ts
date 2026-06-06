import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {
  CreateChatPayload,
  createWidgetChatKey,
  useCreateWidgetChat,
} from '@livechat/widget/conversation-screen/requests/use-create-widget-chat';
import {
  SubmitChatMessagePayload,
  submitWidgetChatMessageKey,
  useSubmitWidgetChatMessage,
} from '@livechat/widget/conversation-screen/requests/use-submit-widget-chat-message';
import {getWidgetBootstrapData} from '@livechat/widget/hooks/use-widget-bootstrap-data';
import {widgetStore} from '@livechat/widget/widget-store';
import {useIsMutating} from '@tanstack/react-query';
import {nanoid} from 'nanoid';
import {useCallback} from 'react';

type MessagePayload = Omit<SubmitChatMessagePayload, 'message'> & {
  message: Omit<SubmitChatMessagePayload['message'], 'uuid'> & {uuid?: string};
};

type ChatPayload = Omit<CreateChatPayload, 'message'> & {
  message?: Omit<Required<CreateChatPayload>['message'], 'uuid'> & {
    uuid?: string;
  };
};

export function useChatMessageSubmitter() {
  const createChatMutation = useCreateWidgetChat();
  const sendMessageMutation = useSubmitWidgetChatMessage();
  const isPending =
    useIsMutating({
      predicate: mutation =>
        mutation.options.mutationKey === createWidgetChatKey ||
        mutation.options.mutationKey === submitWidgetChatMessageKey,
    }) > 0;

  const submitMessage = useCallback((payload: MessagePayload) => {
    return sendMessageMutation.mutateAsync(
      {
        ...payload,
        message: {
          ...payload.message,
          uuid: payload.message.uuid || nanoid(),
        },
      },
      {
        onSuccess: (_, payload) => {
          widgetStore().setActiveConversationId(+payload.conversationId);
          window.parent.postMessage(
            {
              source: 'livechat-widget',
              type: 'activeConversationChanged',
              conversationId: +payload.conversationId,
            },
            '*',
          );
        },
        onError: err => showHttpErrorToast(err),
      },
    );
  }, []);

  const createChat = useCallback((payload: ChatPayload) => {
    return createChatMutation.mutateAsync({
      ...payload,
      message: payload.message
        ? {
            ...payload.message,
            uuid: payload.message.uuid || nanoid(),
          }
        : undefined,
      flowId: payload.startWithGreeting
        ? getWidgetBootstrapData().newChatGreeting?.flow_id
        : null,
    });
  }, []);

  const sendMessageOrCreateChat = useCallback(
    (payload: MessagePayload) => {
      if (payload.conversationId) {
        return submitMessage(payload);
      } else {
        return createChat({
          ...payload,
          startWithGreeting: true,
        });
      }
    },
    [createChat, submitMessage],
  );

  return {
    submitMessage,
    createChat,
    sendMessageOrCreateChat,
    isPending,
  };
}
