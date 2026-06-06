import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {CreateRolePayload} from '@common/admin/roles/requests/user-create-role';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';

export function useUpdateRole() {
  const {roleId} = useRequiredParams(['roleId']);
  const {trans} = useTrans();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: Partial<CreateRolePayload>) =>
      apiClient.put(`roles/${roleId}`, payload).then(r => r.data),
    onSuccess: () => {
      toast(trans(message('Role updated')));
      queryClient.invalidateQueries({
        queryKey: commonAdminQueries.roles.invalidateKey,
      });
      navigate('/admin/roles');
    },
    onError: err => showHttpErrorToast(err),
  });
}
