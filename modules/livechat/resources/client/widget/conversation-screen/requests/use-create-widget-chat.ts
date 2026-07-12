import {addAnimatingMessage} from '@app/dashboard/conversations/conversation-page/messages/animating-messages';
import {makeStreamedFetchRequest} from '@common/http/make-streamed-fetch-request';
import {queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {aiAgentStreamIterator} from '@livechat/widget/chat/ai-agent/ai-agent-stream-iterator';
import {FullWidgetConversationResponse} from '@livechat/widget/conversation-screen/requests/full-widget-conversation-response';
import {
  setWidgetConversationQueryData,
  widgetQueries,
} from '@livechat/widget/widget-queries';
import {widgetStore} from '@livechat/widget/widget-store';
import {useMutation} from '@tanstack/react-query';
import {getWidgetBootstrapData} from '@livechat/widget/hooks/use-widget-bootstrap-data';

export interface CreateChatPayload {
  message?: {
    uuid: string;
    body: string;
    attachments?: {id: number}[];
  };
  preChatForm?: Record<string, unknown>;
  flowId?: number | null;
  startWithGreeting?: boolean;
}

export const createWidgetChatKey = ['create-widget-chat'];

export function useCreateWidgetChat() {
  const navigate = useNavigate();
  return useMutation({
    mutationKey: createWidgetChatKey,
    mutationFn: (payload: CreateChatPayload) => {
      if (payload.message) {
        addAnimatingMessage(payload.message.uuid);
      }

      const abortController = new AbortController();
      const handleConversationCreated = async (
        data: FullWidgetConversationResponse,
      ) => {
        widgetStore().setActiveConversationId(data.conversation.id);
        window.parent.postMessage(
          {
            source: 'livechat-widget',
            type: 'activeConversationChanged',
            conversationId: data.conversation.id,
          },
          '*',
        );
        setWidgetConversationQueryData(data.conversation.id, data);
        await navigate(
          `/${widgetStore().isAiAgentPreviewMode ? 'ai-agent-preview-mode' : 'conversations'}/${data.conversation.id}`,
          {
            replace: true,
          },
        );
      };

      return makeStreamedFetchRequest(
        `lc/widget/chats`,
        preparePayload(payload),
        abortController.signal,
      ).then(async r => {
        for await (const item of aiAgentStreamIterator(r, abortController)) {
          if (
            item.event === 'message' &&
            item.data.type === 'conversationCreated'
          ) {
            handleConversationCreated(item.data.data);
          }
        }
      });
    },
    onError: err => showHttpErrorToast(err),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: widgetQueries.conversations.invalidateKey,
      });
      queryClient.invalidateQueries({
        queryKey: widgetQueries.customers.invalidateKey,
      });
    },
  });
}

export function preparePayload(payload: CreateChatPayload) {
  const message = payload.message
    ? {
        ...payload.message,
        attachments: payload.message.attachments?.map(f => f.id),
      }
    : undefined;

  const bootstrap = getWidgetBootstrapData();

  return {
    message,
    preChatForm: payload.preChatForm,
    flowId: payload.flowId,
    startWithGreeting: payload.startWithGreeting,
    department: bootstrap?.department ?? undefined,
    aiAgentId: bootstrap?.aiAgentId ?? bootstrap?.aiAgent?.id ?? undefined,
  };
}
