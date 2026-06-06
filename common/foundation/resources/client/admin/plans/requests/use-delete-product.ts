import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';

const endpoint = (id: number) => `billing/products/${id}`;

interface Response extends BackendResponse {}

interface Payload {
  productId: number;
}

export function useDeleteProduct() {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: Payload) => updateProduct(payload),
    onSuccess: () => {
      toast(trans(message('Plan deleted')));
      queryClient.invalidateQueries({
        queryKey: commonAdminQueries.products.invalidateKey,
      });
    },
    onError: err => showHttpErrorToast(err),
  });
}

function updateProduct({productId}: Payload): Promise<Response> {
  return apiClient.delete(endpoint(productId)).then(r => r.data);
}
