import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {CreateCategoryPayload} from '@app/help-center/manager/crupdate-category-dialog/use-create-category';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

interface Response extends BackendResponse {
  category: {
    id: number;
    name: string;
    is_section: boolean;
  };
}

interface UpdateCategoryPayload extends CreateCategoryPayload {
  id: number;
}

export function useUpdateCategory(form: UseFormReturn<CreateCategoryPayload>) {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (payload: UpdateCategoryPayload) =>
      apiClient
        .put<Response>(`hc/categories/${payload.id}`, payload)
        .then(r => r.data),
    onSuccess: async response => {
      await queryClient.invalidateQueries({
        queryKey: helpCenterQueries.manager.invalidateKey,
      });
      toast(
        trans(
          response.category.is_section
            ? message('Category updated')
            : message('Section updated'),
        ),
      );
    },
    onError: err => onFormQueryError(err, form),
  });
}
