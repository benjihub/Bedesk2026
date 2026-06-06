import {
  ConversationContentItem,
  MessageButton,
} from '@app/dashboard/conversations/conversation-page/messages/conversation-message';
import {makeStreamedFetchRequest} from '@common/http/make-streamed-fetch-request';
import {queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {aiAgentStreamIterator} from '@livechat/widget/chat/ai-agent/ai-agent-stream-iterator';
import {useChatMessageSubmitter} from '@livechat/widget/conversation-screen/requests/use-chat-message-submitter';
import {useIsAiAgentPreviewMode} from '@livechat/widget/hooks/use-is-ai-agent-preview-mode';
import {widgetQueries} from '@livechat/widget/widget-queries';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {useNavigate} from 'react-router';

export function useHandleButtonAction(messageItem: ConversationContentItem) {
  const navigate = useNavigate();
  const {sendMessageOrCreateChat, isPending} = useChatMessageSubmitter();
  const goToNode = useGoToNode(messageItem.conversation_id);
  const setAttributes = useSetAttributes(messageItem.conversation_id);
  const isAiAgentPreviewMode = useIsAiAgentPreviewMode();

  const handleButtonAction = (button: MessageButton) => {
    switch (button.actionType) {
      case 'openUrl':
        window.open(button.actionValue, '_blank');
        break;
      case 'copyToClipboard':
        navigator.clipboard?.writeText(button.actionValue);
        toast(message('Copied to clipboard!'));
        break;
      case 'goToNode':
        goToNode.mutate({
          nodeId: button.actionValue,
        });
        break;
      case 'setAttributes':
        setAttributes.mutate(button);
        break;
      case 'openEmbed':
        if (isAiAgentPreviewMode) {
          toast.danger(message('Embed is not available in preview mode'));
          return;
        }
        navigate('/embed', {state: {embedUrl: button.actionValue}});
        break;
      // send message
      default:
        sendMessageOrCreateChat({
          message: {
            body: button.actionValue || button.name,
          },
          conversationId: messageItem.conversation_id,
        });
        break;
    }
  };

  return {
    handleButtonAction,
    isPending: goToNode.isPending || isPending,
  };
}

function useGoToNode(conversationId: string | number) {
  return useMutation({
    mutationFn: (payload: {nodeId: string}) => {
      const abortController = new AbortController();
      return makeStreamedFetchRequest(
        `conversations/${conversationId}/flows/go-to-node`,
        payload,
        abortController.signal,
      ).then(async r => {
        for await (const item of aiAgentStreamIterator(
          r,
          abortController,
          conversationId,
        )) {
          //
        }
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: widgetQueries.conversations.invalidateKey,
      }),
    onError: err => showHttpErrorToast(err),
  });
}

function useSetAttributes(conversationId: string | number) {
  return useMutation({
    mutationFn: (payload: MessageButton) => {
      const abortController = new AbortController();
      return makeStreamedFetchRequest(
        `conversations/${conversationId}/flows/set-attributes`,
        {
          message: payload.actionValue,
          attributes: payload.attributes,
        },
        abortController.signal,
      ).then(async r => {
        for await (const item of aiAgentStreamIterator(
          r,
          abortController,
          conversationId,
        )) {
          //
        }
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: widgetQueries.conversations.invalidateKey,
      }),
    onError: err => showHttpErrorToast(err),
  });
}
