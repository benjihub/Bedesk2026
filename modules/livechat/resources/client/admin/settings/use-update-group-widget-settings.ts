import {useMutation} from '@tanstack/react-query';
import {apiClient} from '@common/http/query-client';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {UseFormReturn} from 'react-hook-form';
import {AdminSettings} from '@common/admin/settings/admin-settings';

interface UpdateGroupWidgetSettingsPayload {
  settings: {
    widget: AdminSettings['client']['chatWidget'];
  };
}

export function useUpdateGroupWidgetSettings(
  groupId: number,
  form: UseFormReturn<AdminSettings>,
) {
  return useMutation({
    mutationFn: (payload: UpdateGroupWidgetSettingsPayload) =>
      apiClient
        .put(`helpdesk/groups/${groupId}/settings`, payload)
        .then(r => r.data),
    onSuccess: () => {
      toast(message('Widget settings updated for this group'));
    },
    onError: r => onFormQueryError(r, form),
  });
}
