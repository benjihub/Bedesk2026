import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {View} from '@app/dashboard/views/view';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';

export function useUpdateView(
  viewId: number | string,
  form?: UseFormReturn<Partial<View>>,
) {
  return useMutation({
    mutationFn: (payload: Partial<View>) =>
      apiClient
        .put<Response>(`helpdesk/views/${viewId}`, payload)
        .then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.views.invalidateKey,
      });
    },
    onError: err =>
      form ? onFormQueryError(err, form, [], true) : showHttpErrorToast(err),
  });
}
