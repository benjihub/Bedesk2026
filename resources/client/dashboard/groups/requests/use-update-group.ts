import {CreateGroupPayload} from '@app/dashboard/groups/requests/use-create-group';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';
import {useParams} from 'react-router';

export interface UpdateGroupPayload extends Partial<CreateGroupPayload> {}

export function useUpdateGroup(
  form: UseFormReturn<Partial<UpdateGroupPayload>>,
) {
  const navigate = useNavigate();
  const {groupId} = useParams();
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: UpdateGroupPayload) =>
      apiClient.put(`helpdesk/groups/${groupId}`, payload).then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.groups.invalidateKey,
      });
      toast(trans(message('Updated group')));
      navigate('/dashboard/team/groups');
    },
    onError: r => onFormQueryError(r, form),
  });
}
