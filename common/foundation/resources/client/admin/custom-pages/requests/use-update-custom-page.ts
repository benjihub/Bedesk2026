import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {CreateCustomPagePayload} from '@common/admin/custom-pages/requests/use-create-custom-page';
import {DatatableDataQueryKey} from '@common/datatable/requests/paginated-resources';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {useParams} from 'react-router';
import {CustomPage} from '../custom-page';

interface Response extends BackendResponse {
  page: CustomPage;
}

export function useUpdateCustomPage(endpoint?: string) {
  const {pageId} = useParams();
  const finalEndpoint = `${endpoint || 'custom-pages'}/${pageId}`;
  return useMutation({
    mutationFn: (payload: CreateCustomPagePayload) =>
      updatePage(payload, finalEndpoint),
    onError: err => showHttpErrorToast(err),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: commonAdminQueries.customPages.invalidateKey,
      });
      await queryClient.invalidateQueries({
        queryKey: DatatableDataQueryKey(finalEndpoint),
      });
      toast(message('Page updated'));
    },
  });
}

function updatePage(
  payload: CreateCustomPagePayload,
  endpoint: string,
): Promise<Response> {
  return apiClient.put(`${endpoint}`, payload).then(r => r.data);
}
