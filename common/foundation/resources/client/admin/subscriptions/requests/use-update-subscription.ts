import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {Subscription} from '@common/billing/subscription';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

interface Response extends BackendResponse {
  subscription: Subscription;
}

export interface UpdateSubscriptionPayload extends Partial<Subscription> {
  id: number;
}

export function useUpdateSubscription(
  form: UseFormReturn<UpdateSubscriptionPayload>,
) {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (props: UpdateSubscriptionPayload) => updateSubscription(props),
    onSuccess: () => {
      toast(trans(message('Subscription updated')));
      queryClient.invalidateQueries({
        queryKey: commonAdminQueries.subscriptions.invalidateKey,
      });
    },
    onError: err => onFormQueryError(err, form),
  });
}

function updateSubscription({
  id,
  ...payload
}: UpdateSubscriptionPayload): Promise<Response> {
  return apiClient
    .put(`billing/subscriptions/${id}`, payload)
    .then(r => r.data);
}
