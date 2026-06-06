import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient, queryClient} from '@common/http/query-client';
import {useMutation} from '@tanstack/react-query';
import {ChipValue} from '@ui/forms/input-field/chip-field/chip-field';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';

export interface CreateArticlePayload {
  title: string;
  body: string;
  slug?: string;
  draft: boolean;
  visibility: 'public' | 'private';
  visible_to_role?: number;
  author_id?: number;
  managed_by_role?: number;
  description?: string;
  sections?: number[];
  tags?: ChipValue[];
  attachments: {
    id: number;
    name: string;
    file_size: number;
    mime: string;
    hash: string;
  }[];
}

export function useCreateArticle(form: UseFormReturn<CreateArticlePayload>) {
  const {trans} = useTrans();
  return useMutation({
    mutationFn: (props: CreateArticlePayload) => createArticle(props),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpCenterQueries.articles.invalidateKey,
      });
      toast(trans(message('Article created')));
    },
    onError: err => onFormQueryError(err, form, ['body']),
  });
}

export function articleEditorFormValueToPayload(
  formValue: Partial<CreateArticlePayload>,
) {
  return {
    ...formValue,
    attachments: formValue.attachments?.map(a => a.id),
    tags: formValue.tags?.map(t => t.name),
  };
}

function createArticle(
  formValue: CreateArticlePayload,
): Promise<{article: {id: number}}> {
  return apiClient
    .post('hc/articles', articleEditorFormValueToPayload(formValue))
    .then(r => r.data);
}
