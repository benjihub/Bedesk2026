import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {toast} from '@ui/toast/toast';

interface Payload {
  all?: true;
  snippetIds?: (number | string)[];
}

export function useUningestSnippets() {
  return useMutation({
    mutationFn: (payload: Payload) => {
      return apiClient
        .post('lc/ai-agent/snippets/uningest', payload)
        .then(r => r.data);
    },
    onSuccess: () => {
      toast({message: 'Disabled snippets for AI agent'});
      return queryClient.invalidateQueries({
        queryKey: aiAgentQueries.knowledge.invalidateKey,
      });
    },
    onError: r => showHttpErrorToast(r),
  });
}
