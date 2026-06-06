import {
  articleEditorFormValueToPayload,
  CreateArticlePayload,
} from '@app/help-center/articles/requests/use-create-article';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {UseFormReturn} from 'react-hook-form';

export interface UpdateArticlePayload extends Partial<CreateArticlePayload> {
  id: number;
}

export function useUpdateArticle(form?: UseFormReturn<UpdateArticlePayload>) {
  return useMutation({
    mutationFn: (payload: UpdateArticlePayload) => updateArticle(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpCenterQueries.articles.invalidateKey,
      });
    },
    onError: err =>
      form ? onFormQueryError(err, form) : showHttpErrorToast(err),
  });
}

function updateArticle({
  id,
  ...formValue
}: UpdateArticlePayload): Promise<{article: {id: number}}> {
  return apiClient
    .put(`hc/articles/${id}`, articleEditorFormValueToPayload(formValue))
    .then(r => r.data);
}
