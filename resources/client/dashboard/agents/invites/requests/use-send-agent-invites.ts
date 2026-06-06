import {Group} from '@app/dashboard/groups/group';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';

interface Response extends BackendResponse {
  group: Group;
}

interface Payload {
  emails: string[];
  role_id: number | string;
  group_id: number | string;
}

export function useSendAgentInvites() {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: Payload) => sendInvites(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.agentInvites.invalidateKey,
      });
      toast(trans(message('Agents invited')));
    },
    onError: r => showHttpErrorToast(r),
  });
}

function sendInvites(payload: Payload) {
  return apiClient
    .post<Response>('helpdesk/agents/invite', payload)
    .then(r => r.data);
}
