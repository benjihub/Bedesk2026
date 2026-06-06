import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {Product} from '@common/billing/product';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';
import {CreateProductPayload} from './use-create-product';

interface Response extends BackendResponse {
  product: Product;
}

export interface UpdateProductPayload extends CreateProductPayload {
  id: number;
}

export function useUpdateProduct(form: UseFormReturn<UpdateProductPayload>) {
  const {trans} = useTrans();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: UpdateProductPayload) => updateProduct(payload),
    onSuccess: () => {
      toast(trans(message('Plan updated')));
      queryClient.invalidateQueries({
        queryKey: commonAdminQueries.products.invalidateKey,
      });
      navigate('/admin/plans');
    },
    onError: err => onFormQueryError(err, form),
  });
}

function updateProduct({
  id,
  ...payload
}: UpdateProductPayload): Promise<Response> {
  const backendPayload = {
    ...payload,
    feature_list: payload.feature_list.map(feature => feature.value),
  };
  return apiClient
    .put(`billing/products/${id}`, backendPayload)
    .then(r => r.data);
}
