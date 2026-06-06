import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';

export interface UpdateGroupAiAgentSettingsPayload {
  overrides: Record<string, unknown>;
}

export function useUpdateGroupAiAgentSettings(
  groupId: number,
  form: UseFormReturn<UpdateGroupAiAgentSettingsPayload>,
) {
  return useMutation({
    mutationFn: (payload: UpdateGroupAiAgentSettingsPayload) =>
      apiClient
        .put(`helpdesk/groups/${groupId}/ai-agent-settings`, payload)
        .then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.groupAiAgentSettings.invalidateKey(groupId),
      });
    },
    onError: r => onFormQueryError(r, form),
  });
}
