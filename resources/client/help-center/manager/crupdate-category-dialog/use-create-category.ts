import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient, queryClient} from '@common/http/query-client';
import {useNavigate} from '@common/ui/navigation/use-navigate';
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

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  image?: string;
  parent_id?: number;
  visible_to_role?: number | null;
  managed_by_role?: number | null;
  hide_from_structure?: boolean;
}

export function useCreateCategory(form: UseFormReturn<CreateCategoryPayload>) {
  const {trans} = useTrans();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      apiClient.post<Response>('hc/categories', payload).then(r => r.data),
    onSuccess: async r => {
      await queryClient.invalidateQueries({
        queryKey: helpCenterQueries.manager.invalidateKey,
      });
      navigate(
        r.category.is_section
          ? `../../sections/${r.category.id}`
          : `categories/${r.category.id}`,
        {relative: 'path'},
      );
      toast(
        trans(
          r.category.is_section
            ? message('Category created')
            : message('Section created'),
        ),
      );
    },
    onError: err => onFormQueryError(err, form),
  });
}
