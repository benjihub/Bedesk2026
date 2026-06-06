import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';

export function useUnbanUsers(userIds: number[]) {
  return useMutation({
    mutationFn: () =>
      apiClient.delete(`users/unban/${userIds.join(',')}`).then(r => r.data),
    onSuccess: () => {
      toast(
        message('[one User|other :count Users] unsuspended', {
          values: {count: userIds.length},
        }),
      );
      queryClient.invalidateQueries({queryKey: ['users']});
    },
    onError: r => showHttpErrorToast(r),
  });
}
