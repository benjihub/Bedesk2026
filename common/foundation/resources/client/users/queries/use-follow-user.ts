import {BackendResponse} from '@common/http/backend-response/backend-response';
import {useMutation} from '@tanstack/react-query';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {User} from '@ui/types/user';

interface Response extends BackendResponse {}

interface Payload {
  user: User;
}

export function useFollowUser() {
  return useMutation({
    mutationFn: (payload: Payload) => followUser(payload),
    onSuccess: async (response, {user}) => {
      await queryClient.invalidateQueries({queryKey: ['users']});
      toast(message('Following :name', {values: {name: user.name}}));
    },
    onError: r => showHttpErrorToast(r),
  });
}

function followUser({user}: Payload): Promise<Response> {
  return apiClient.post(`users/${user.id}/follow`).then(r => r.data);
}
