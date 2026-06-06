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
  delete?: boolean;
}

export function useCancelSubscription() {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (props: Payload) => cancelSubscription(props),
    onSuccess: (response, payload) => {
      toast(
        payload.delete
          ? trans(message('Subscription deleted.'))
          : trans(message('Subscription cancelled.')),
      );
    },
    onError: err => showHttpErrorToast(err),
  });
}

function cancelSubscription({
  subscriptionId,
  ...payload
}: Payload): Promise<Response> {
  return apiClient
    .post(`billing/subscriptions/${subscriptionId}/cancel`, payload)
    .then(r => r.data);
}
