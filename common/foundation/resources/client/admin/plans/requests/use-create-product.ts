import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {Price} from '@common/billing/price';
import {Product} from '@common/billing/product';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

export interface CreateProductPayload
  extends Omit<Partial<Product>, 'feature_list' | 'prices'> {
  feature_list: {value: string}[];
  prices: Omit<Price, 'id'>[];
}

export function useCreateProduct(form: UseFormReturn<CreateProductPayload>) {
  const {trans} = useTrans();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: () => {
      toast(trans(message('Plan created')));
      queryClient.invalidateQueries({
        queryKey: commonAdminQueries.products.invalidateKey,
      });
      navigate('/admin/plans');
    },
    onError: err => onFormQueryError(err, form),
  });
}

function createProduct(payload: CreateProductPayload): Promise<Response> {
  const backendPayload = {
    ...payload,
    feature_list: payload.feature_list.map(feature => feature.value),
  };
  return apiClient.post('billing/products', backendPayload).then(r => r.data);
}
