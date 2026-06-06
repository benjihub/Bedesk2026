import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';

export function useRevokeAgentInvite() {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: {inviteId: number}) => revokeInvite(payload.inviteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.agentInvites.invalidateKey,
      });
      toast(trans(message('Invite revoked')));
    },
    onError: r => showHttpErrorToast(r),
  });
}

function revokeInvite(inviteId: string | number) {
  return apiClient
    .delete<Response>(`helpdesk/agents/invite/${inviteId}`)
    .then(r => r.data);
}
