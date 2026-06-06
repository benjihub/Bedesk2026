import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {getAiAgentGroupIdFromUrl} from '@ai/ai-agent/ai-agent-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {useNavigate} from 'react-router';

interface Payload {
  websiteId: string | number;
  webpageId: string | number;
}
export function useDeleteWebpage() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async ({websiteId, webpageId}: Payload) => {
      const groupId = getAiAgentGroupIdFromUrl();
      return apiClient.delete(
        `lc/ai-agent/websites/${websiteId}/webpages/${webpageId}${
          groupId ? `?groupId=${groupId}` : ''
        }`,
      );
    },
    onSuccess: () => {
      toast(message('Webpage deleted'));
      navigate(`..`, {relative: 'path'});
      queryClient.invalidateQueries({
        queryKey: aiAgentQueries.knowledge.invalidateKey,
      });
    },
    onError: err => showHttpErrorToast(err),
  });
}
