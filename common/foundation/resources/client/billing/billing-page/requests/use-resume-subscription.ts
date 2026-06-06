import {useMutation} from '@tanstack/react-query';
import {apiClient} from '@common/http/query-client';
import {useTrans} from '@ui/i18n/use-trans';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {User} from '@ui/types/user';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';

interface Response extends BackendResponse {
  user: User;
}

interface Payload {
  subscriptionId: number;
}

export function useResumeSubscription() {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (props: Payload) => resumeSubscription(props),
    onSuccess: () => {
      toast(trans(message('Subscription renewed.')));
    },
    onError: err => showHttpErrorToast(err),
  });
}

function resumeSubscription({subscriptionId}: Payload): Promise<Response> {
  return apiClient
    .post(`billing/subscriptions/${subscriptionId}/resume`)
    .then(r => r.data);
}
