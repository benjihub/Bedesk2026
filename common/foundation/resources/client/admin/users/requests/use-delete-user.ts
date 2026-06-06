import {useMutation} from '@tanstack/react-query';
import {apiClient, queryClient} from '@common/http/query-client';
import {toast} from '@ui/toast/toast';
import {useTrans} from '@ui/i18n/use-trans';
import {message} from '@ui/i18n/message';
import {DatatableDataQueryKey} from '@common/datatable/requests/paginated-resources';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';

export function useDeleteUser() {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: {userId: number}) => deleteUser(payload.userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: DatatableDataQueryKey('users'),
      });
      toast(trans(message('User deleted')));
    },
    onError: r => showHttpErrorToast(r),
  });
}

function deleteUser(userId: string | number) {
  return apiClient.delete<Response>(`users/${userId}`).then(r => r.data);
}
