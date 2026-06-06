import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

export interface CreateRolePayload {
  name: string;
  description?: string;
  type?: string;
  permissions?: {id: number; restrictions?: {name: string; value: any}[]}[];
}

export function useCreateRole(form: UseFormReturn<CreateRolePayload>) {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) =>
      apiClient.post('roles', payload).then(r => r.data),
    onSuccess: () => {
      toast(trans(message('Created new role')));
      queryClient.invalidateQueries({
        queryKey: commonAdminQueries.roles.invalidateKey,
      });
    },
    onError: r => onFormQueryError(r, form),
  });
}
