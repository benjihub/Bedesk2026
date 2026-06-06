import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';

export function useDeleteGroup() {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: {groupId: number}) =>
      apiClient.delete(`helpdesk/groups/${payload.groupId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.groups.invalidateKey,
      });
      toast(trans(message('Deleted group')));
    },
    onError: r => showHttpErrorToast(r),
  });
}
