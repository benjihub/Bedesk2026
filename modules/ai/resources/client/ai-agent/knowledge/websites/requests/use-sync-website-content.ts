import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {getAiAgentGroupIdFromUrl} from '@ai/ai-agent/ai-agent-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';

interface Payload {
  websiteId: string | number;
}
export function useSyncWebsiteContent() {
  return useMutation({
    mutationFn: async ({websiteId}: Payload) => {
      const groupId = getAiAgentGroupIdFromUrl();
      return apiClient.post(`lc/ai-agent/websites/${websiteId}/sync`, {
        ...(groupId ? {groupId} : {}),
      });
    },
    onSuccess: () => {
      toast(message('Website sync started'));
      return queryClient.invalidateQueries({
        queryKey: aiAgentQueries.knowledge.invalidateKey,
      });
    },
    onError: err => showHttpErrorToast(err),
  });
}
