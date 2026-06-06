import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentSettings} from '@ai/ai-agent/settings/ai-agent-settings';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';

export function useUpdateAiAgentSettings(
  form?: UseFormReturn<Partial<AiAgentSettings>>,
) {
  return useMutation({
    mutationFn: (values: Partial<AiAgentSettings>) => {
      // merge with current settings so partial panel updates won't omit required fields
      const current = queryClient.getQueryData<any>(
        aiAgentQueries.settings.index().queryKey,
      ) as {settings?: AiAgentSettings} | undefined;
      const merged = {...(current?.settings ?? {}), ...(values ?? {})};
      const groupId =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('groupId')
          : null;

      return apiClient.put('lc/ai-agent/settings', {
        aiAgent: merged,
        ...(groupId ? {groupId: Number(groupId)} : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: aiAgentQueries.settings.invalidateKey,
      });
    },
    onError: err => {
      if (form) {
        onFormQueryError(err, form);
      } else {
        showHttpErrorToast(err);
      }
    },
  });
}
