import {useMutation} from '@tanstack/react-query';
import {apiClient, queryClient} from '@common/http/query-client';
import {useTrans} from '@ui/i18n/use-trans';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {DatatableDataQueryKey} from '@common/datatable/requests/paginated-resources';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {UseFormReturn} from 'react-hook-form';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Trigger} from '@app/triggers/trigger';

interface Response extends BackendResponse {
  trigger: Trigger;
}

export interface CreateTriggerPayload {
  name: string;
  description?: string;
  conditions: Trigger['config']['conditions'];
  actions: Trigger['config']['actions'];
}

export function useCreateTrigger(form: UseFormReturn<CreateTriggerPayload>) {
  const {trans} = useTrans();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (props: CreateTriggerPayload) => createTrigger(props),
    onSuccess: response => {
      queryClient.invalidateQueries({
        queryKey: DatatableDataQueryKey('triggers'),
      });
      navigate(`/admin/triggers/${response.trigger.id}/edit`);
      toast(trans(message('Trigger created')));
    },
    onError: err => onFormQueryError(err, form),
  });
}

function createTrigger(payload: CreateTriggerPayload) {
  return apiClient.post<Response>('triggers', payload).then(r => r.data);
}
