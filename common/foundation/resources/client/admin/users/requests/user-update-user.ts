import {UpdateUserPageUser} from '@common/admin/users/update-user-page/update-user-page-user';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {User} from '@ui/types/user';
import {UseFormReturn} from 'react-hook-form';

interface Response extends BackendResponse {
  user: User;
}

export interface UpdateUserPayload
  extends Omit<Partial<UpdateUserPageUser>, 'email_verified_at'> {
  email_verified_at?: boolean;
}

export function useUpdateUser(
  userId: number,
  form?: UseFormReturn<UpdateUserPayload>,
) {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(userId, payload),
    onSuccess: () => {
      toast(message('User updated'));
      queryClient.invalidateQueries({queryKey: ['users']});
      navigate('../..', {relative: 'path'});
    },
    onError: r => (form ? onFormQueryError(r, form) : showHttpErrorToast(r)),
  });
}

function updateUser(
  userId: number,
  payload: UpdateUserPayload,
): Promise<Response> {
  if (payload.roles) {
    payload.roles = payload.roles.map(r => r.id) as any;
  }
  return apiClient.put(`users/${userId}`, payload).then(r => r.data);
}
