import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {EnvatoPurchaseCode} from '@envato/envato-purchase-code';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

interface Response extends BackendResponse {
  purchases?: EnvatoPurchaseCode[];
}

interface Payload {
  userId: number | string;
  purchaseCode: string;
}

export function useAddPurchaseUsingCode(
  form: UseFormReturn<{purchaseCode: string}>,
) {
  return useMutation({
    mutationFn: (payload: Payload) => addPurchase(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.envato.invalidateKey,
      });
      toast(message('Purchase added'));
    },
    onError: err => onFormQueryError(err, form),
  });
}

function addPurchase(payload: Payload): Promise<Response> {
  return apiClient
    .post(`users/${payload.userId}/envato/add-purchase-using-code`, payload)
    .then(r => r.data);
}
