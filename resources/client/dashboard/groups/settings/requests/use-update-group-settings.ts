import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';

export interface UpdateGroupSettingsPayload {
  settings: Record<string, unknown>;
}

export function useUpdateGroupSettings(
  groupId: number,
  form: UseFormReturn<UpdateGroupSettingsPayload>,
) {
  return useMutation({
    mutationFn: (payload: UpdateGroupSettingsPayload) =>
      apiClient
        .put(`helpdesk/groups/${groupId}/settings`, payload)
        .then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.groupSettings.invalidateKey(groupId),
      });
    },
    onError: r => onFormQueryError(r, form),
  });
}
