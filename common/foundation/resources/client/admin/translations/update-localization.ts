import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {useMutation} from '@tanstack/react-query';
import {Localization} from '@ui/i18n/localization';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';
import {onFormQueryError} from '../../errors/on-form-query-error';
import {apiClient, queryClient} from '../../http/query-client';
import {showHttpErrorToast} from '../../http/show-http-error-toast';

export function useUpdateLocalization(
  form?: UseFormReturn<Partial<Localization>>,
) {
  return useMutation({
    mutationFn: ({id, ...other}: Partial<Localization>) =>
      apiClient.put(`localizations/${id}`, other).then(r => r.data),
    onSuccess: () => {
      toast(message('Localization updated'));
      queryClient.invalidateQueries({
        queryKey: commonAdminQueries.localizations.invalidateKey,
      });
    },
    onError: r => (form ? onFormQueryError(r, form) : showHttpErrorToast(r)),
  });
}
