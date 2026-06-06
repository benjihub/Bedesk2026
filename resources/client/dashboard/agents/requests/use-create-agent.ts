import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';

interface Response extends BackendResponse {
  agent: {id: number; name: string; email: string};
}

export interface CreateAgentPayload {
  name: string;
  email: string;
  password: string;
  role_id: number | string;
  group_id: number | string;
}

export function useCreateAgent() {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: CreateAgentPayload) => createAgent(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.agents.invalidateKey,
      });
      toast(trans(message('Agent created')));
    },
    onError: r => showHttpErrorToast(r),
  });
}

function createAgent(payload: CreateAgentPayload) {
  return apiClient.post<Response>('helpdesk/agents', payload).then(r => r.data);
}
