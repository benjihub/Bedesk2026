import {useMutation} from '@tanstack/react-query';
import {apiClient, queryClient} from '@common/http/query-client';
import {useTrans} from '@ui/i18n/use-trans';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {toast} from '@ui/toast/toast';
import {message} from '@ui/i18n/message';
import {DatatableDataQueryKey} from '@common/datatable/requests/paginated-resources';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {UseFormReturn} from 'react-hook-form';
import {useParams} from 'react-router';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {CreateTriggerPayload} from '@app/triggers/requests/use-create-trigger';
import {Trigger} from '@app/triggers/trigger';

interface Response extends BackendResponse {
  trigger: Trigger;
}

export interface UpdateTriggerPayload extends CreateTriggerPayload {}

export function useUpdateTrigger(form: UseFormReturn<UpdateTriggerPayload>) {
  const {trans} = useTrans();
  const {triggerId} = useParams();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (props: UpdateTriggerPayload) =>
      updateTrigger(triggerId!, props),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DatatableDataQueryKey('triggers'),
      });
      navigate('/admin/triggers');
      toast(trans(message('Trigger updated')));
    },
    onError: err => onFormQueryError(err, form),
  });
}

function updateTrigger(
  triggerId: number | string,
  payload: UpdateTriggerPayload,
) {
  return apiClient
    .put<Response>(`triggers/${triggerId}`, payload)
    .then(r => r.data);
}
