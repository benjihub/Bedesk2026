import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';
import {DatatableAttribute} from '../datatable/datatable-attribute';

export function useUpdateAttribute(
  attributeId: number | string,
  form?: UseFormReturn<Partial<DatatableAttribute>>,
) {
  return useMutation({
    mutationFn: (payload: Partial<DatatableAttribute>) =>
      apiClient.put(`helpdesk/attributes/${attributeId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.attributes.invalidateKey,
      });
    },
    onError: err =>
      form ? onFormQueryError(err, form) : showHttpErrorToast(err),
  });
}
