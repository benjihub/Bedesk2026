import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {DatatableDataQueryKey} from '@common/datatable/requests/paginated-resources';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {CustomPage} from '../custom-page';

interface Response extends BackendResponse {
  page: CustomPage;
}

export interface CreateCustomPagePayload {
  title?: string;
  body?: string;
  slug?: string;
  hide_nav?: boolean;
}

export function useCreateCustomPage(endpoint?: string) {
  const finalEndpoint = endpoint || 'custom-pages';
  return useMutation({
    mutationFn: (payload: CreateCustomPagePayload) =>
      createPage(payload, finalEndpoint),
    onError: err => showHttpErrorToast(err),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: commonAdminQueries.customPages.invalidateKey,
      });
      await queryClient.invalidateQueries({
        queryKey: DatatableDataQueryKey(finalEndpoint),
      });
      toast(message('Page created'));
    },
  });
}

function createPage(
  payload: CreateCustomPagePayload,
  endpoint: string,
): Promise<Response> {
  return apiClient.post(`${endpoint}`, payload).then(r => r.data);
}
