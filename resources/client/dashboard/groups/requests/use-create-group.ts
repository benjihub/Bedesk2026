import {Group, GroupUser} from '@app/dashboard/groups/group';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

export interface CreateGroupPayload {
  name: string;
  users: GroupUser[];
  assignment_mode: Group['assignment_mode'];
}

export function useCreateGroup(form: UseFormReturn<CreateGroupPayload>) {
  const navigate = useNavigate();
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) =>
      apiClient.post('helpdesk/groups', payload).then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.groups.invalidateKey,
      });
      toast(trans(message('Created new group')));
      navigate('../groups');
    },
    onError: r => onFormQueryError(r, form),
  });
}
