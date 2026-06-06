import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {Subscription} from '@common/billing/subscription';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {Tag} from '@common/tags/tag';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

const endpoint = 'billing/subscriptions';

interface Response extends BackendResponse {
  tag: Tag;
}

interface Payload extends Partial<Subscription> {}

export function useCreateSubscription(form: UseFormReturn<Payload>) {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (props: Payload) => createNewSubscription(props),
    onSuccess: () => {
      toast(trans(message('Subscription created')));
      queryClient.invalidateQueries({
        queryKey: commonAdminQueries.subscriptions.invalidateKey,
      });
    },
    onError: err => onFormQueryError(err, form),
  });
}

function createNewSubscription(payload: Payload): Promise<Response> {
  return apiClient.post(endpoint, payload).then(r => r.data);
}
