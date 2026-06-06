import {AdminSettings} from '@common/admin/settings/admin-settings';
import {FetchAdminSettingsResponse} from '@common/admin/settings/requests/use-admin-settings';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

export function useUpdateAdminSettings(form: UseFormReturn<AdminSettings>) {
  return useMutation({
    mutationKey: ['submitAdminSettings'],
    mutationFn: (props: AdminSettings) => updateAdminSettings(props),
    onSuccess: response => {
      toast(message('Settings updated'));
      return queryClient.setQueryData(['fetchAdminSettings'], response);
    },
    onError: r => onFormQueryError(r, form),
  });
}

function updateAdminSettings({files, ...other}: AdminSettings) {
  const formData = new FormData();

  Object.entries(files || {}).forEach(([key, file]) => {
    formData.set(key, file);
  });

  for (const key in other) {
    formData.set(
      key,
      JSON.stringify(other[key as keyof Omit<AdminSettings, 'files'>]),
    );
  }

  return apiClient
    .post<FetchAdminSettingsResponse>('settings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then(r => r.data);
}
