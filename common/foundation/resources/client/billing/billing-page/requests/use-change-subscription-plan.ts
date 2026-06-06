import {useMutation} from '@tanstack/react-query';
import {apiClient} from '@common/http/query-client';
import {useTrans} from '@ui/i18n/use-trans';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {User} from '@ui/types/user';
import {invalidateBillingUserQuery} from '../use-billing-user';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';

interface Response extends BackendResponse {
  user: User;
}

interface Payload {
  subscriptionId: number;
  newProductId: number;
  newPriceId: number;
}

export function useChangeSubscriptionPlan() {
  const {trans} = useTrans();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (props: Payload) => changePlan(props),
    onSuccess: () => {
      toast(trans(message('Plan changed.')));
      invalidateBillingUserQuery();
      navigate('/billing');
    },
    onError: err => showHttpErrorToast(err),
  });
}

function changePlan({subscriptionId, ...other}: Payload): Promise<Response> {
  return apiClient
    .post(`billing/subscriptions/${subscriptionId}/change-plan`, other)
    .then(r => r.data);
}
