import {adminQueries} from '@app/admin/admin-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {User} from '@ui/types/user';
import {UseFormReturn} from 'react-hook-form';

interface Response extends BackendResponse {
  user: User;
}

export interface CreateUserPayload
  extends Omit<Partial<User>, 'email_verified_at'> {
  email_verified_at?: boolean;
}

export function useCreateUser(form: UseFormReturn<CreateUserPayload>) {
  return useMutation({
    mutationFn: (props: CreateUserPayload) => createUser(props),
    onSuccess: () => {
      toast(message('User created'));
      queryClient.invalidateQueries({
        queryKey: adminQueries.users.invalidateKey,
      });
    },
    onError: r => onFormQueryError(r, form),
  });
}

function createUser(payload: CreateUserPayload): Promise<Response> {
  if (payload.roles) {
    payload.roles = payload.roles.map(r => r.id) as any;
  }
  return apiClient.post('users', payload).then(r => r.data);
}
