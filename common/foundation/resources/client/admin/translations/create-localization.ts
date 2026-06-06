import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {Localization} from '@ui/i18n/localization';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';
import {onFormQueryError} from '../../errors/on-form-query-error';
import {BackendResponse} from '../../http/backend-response/backend-response';
import {apiClient} from '../../http/query-client';

interface Response extends BackendResponse {
  localization: Localization;
}

export interface CreateLocalizationPayload {
  name: string;
  language: string;
}

function createLocalization(
  payload: CreateLocalizationPayload,
): Promise<Response> {
  return apiClient.post(`localizations`, payload).then(r => r.data);
}

export function useCreateLocalization(
  form: UseFormReturn<CreateLocalizationPayload>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: CreateLocalizationPayload) => createLocalization(props),
    onSuccess: () => {
      toast(message('Localization created'));
      queryClient.invalidateQueries({
        queryKey: commonAdminQueries.localizations.invalidateKey,
      });
    },
    onError: r => onFormQueryError(r, form),
  });
}
