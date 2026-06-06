import {BackendFormValue} from '@common/admin/settings/pages/uploading-settings/backends/backends';
import {UploadingBackendSettings} from '@common/core/settings/base-backend-settings';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';

export function useValidateBackendCredentials(
  form: UseFormReturn<BackendFormValue>,
) {
  return useMutation({
    mutationFn: (payload: UploadingBackendSettings) => {
      return apiClient.put(
        `settings/uploading/validate-backend-credentials`,
        payload,
      );
    },
    onError: r => onFormQueryError(r, form),
  });
}
