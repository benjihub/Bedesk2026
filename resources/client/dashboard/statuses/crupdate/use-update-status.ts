import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {Status} from '@app/dashboard/statuses/status';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

export function useUpdateStatus(status: Status, form?: UseFormReturn<Status>) {
  return useMutation({
    mutationFn: (payload: Partial<Status>) =>
      apiClient.put(`helpdesk/statuses/${status.id}`, payload),
    onSuccess: () => {
      toast(message('Status updated'));
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.statuses.invalidateKey,
      });
    },
    onError: err =>
      form ? onFormQueryError(err, form) : showHttpErrorToast(err),
  });
}
