import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';

interface Payload {
  inviteId: number;
}

export function useResendAgentInvite() {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: Payload) => resendInvite(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.agentInvites.invalidateKey,
      });
      toast(trans(message('Invite resent')));
    },
    onError: r => showHttpErrorToast(r),
  });
}

function resendInvite(payload: Payload) {
  return apiClient
    .post(`helpdesk/agents/invite/${payload.inviteId}/resend`, payload)
    .then(r => r.data);
}
