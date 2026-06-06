import {useMutation, useQueryClient} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';
import {apiClient} from '@common/http/query-client';
import {toast} from '@ui/toast/toast';
import {DatatableDataQueryKey} from '@common/datatable/requests/paginated-resources';
import {useTrans} from '@ui/i18n/use-trans';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {message} from '@ui/i18n/message';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {PaginationResponse} from '@common/http/backend-response/pagination-response';
import {NormalizedModel} from '@ui/types/normalized-model';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {Channel, ChannelConfig} from '@common/channels/channel';

const endpoint = 'channel';

interface Response extends BackendResponse {
  channel: Channel;
}

export interface CreateChannelPayload {
  name: string;
  slug: string;
  type: string;
  public: boolean;
  description?: string;
  config: ChannelConfig;
  content: PaginationResponse<NormalizedModel>;
}

export function useCreateChannel(form: UseFormReturn<CreateChannelPayload>) {
  const {trans} = useTrans();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChannelPayload) => createChannel(payload),
    onSuccess: async response => {
      await queryClient.invalidateQueries({
        queryKey: DatatableDataQueryKey(endpoint),
      });
      toast(trans(message('Channel created')));
      navigate(`/admin/channels/${response.channel.id}/edit`, {
        replace: true,
      });
    },
    onError: err => onFormQueryError(err, form),
  });
}

function createChannel(payload: CreateChannelPayload) {
  return apiClient.post<Response>(endpoint, payload).then(r => r.data);
}
