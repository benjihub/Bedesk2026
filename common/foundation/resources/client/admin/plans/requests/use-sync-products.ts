import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';

interface Response extends BackendResponse {}

export function useSyncProducts() {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: () => syncPlans(),
    onSuccess: () => {
      toast(trans(message('Plans synced')));
      queryClient.invalidateQueries({
        queryKey: commonAdminQueries.products.invalidateKey,
      });
    },
    onError: err => showHttpErrorToast(err, message('Could not sync plans')),
  });
}

function syncPlans(): Promise<Response> {
  return apiClient.post('billing/products/sync').then(r => r.data);
}
