import {useMutation, useQueryClient} from '@tanstack/react-query';
import {apiClient} from '@common/http/query-client';
import {useTrans} from '@ui/i18n/use-trans';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {DatatableDataQueryKey} from '@common/datatable/requests/paginated-resources';
import {CustomDomain} from '@common/custom-domains/custom-domain';

interface Response extends BackendResponse {
  domain: CustomDomain;
}

interface Payload {
  host: string;
  global?: boolean;
}

export function useConnectDomain() {
  const {trans} = useTrans();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (props: Payload) => connectDomain(props),
    onSuccess: response => {
      toast.positive(
        trans(
          message('“:domain” connected', {
            values: {domain: response.domain.host},
          }),
        ),
      );
      queryClient.invalidateQueries({
        queryKey: DatatableDataQueryKey('custom-domain'),
      });
    },
    onError: err => showHttpErrorToast(err),
  });
}

function connectDomain(payload: Payload): Promise<Response> {
  return apiClient.post('custom-domain', payload).then(r => r.data);
}
