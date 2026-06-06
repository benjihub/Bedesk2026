import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

export interface CreateBanPayload {
  ban_until?: string;
  permanent?: boolean;
  comment?: string;
}

export function useBanUsers(
  form: UseFormReturn<CreateBanPayload>,
  userIds: number[],
) {
  return useMutation({
    mutationFn: (payload: CreateBanPayload) =>
      apiClient
        .post(`users/ban/${userIds.join(',')}`, payload)
        .then(r => r.data),
    onSuccess: async () => {
      toast(
        message('[one User|other :count Users] suspended', {
          values: {count: userIds.length},
        }),
      );
      await queryClient.invalidateQueries({queryKey: ['users']});
    },
    onError: r => onFormQueryError(r, form),
  });
}
