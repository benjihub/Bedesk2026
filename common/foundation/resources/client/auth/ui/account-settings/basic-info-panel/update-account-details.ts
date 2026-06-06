import {onFormQueryError} from '@common/errors/on-form-query-error';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {User} from '@ui/types/user';
import {UseFormReturn} from 'react-hook-form';

interface Payload {
  name?: string;
  image?: string | null;
  image_entry_id?: number | null;
}

export function useUpdateAccountDetails(
  userId: number,
  form?: UseFormReturn<Partial<User> & {image_entry_id?: string | null}>,
) {
  return useMutation({
    mutationFn: (payload: Payload) =>
      apiClient.put(`users/${userId}`, payload).then(r => r.data),
    onSuccess: () => {
      toast(message('Updated account details'));
    },
    onError: r => (form ? onFormQueryError(r, form) : showHttpErrorToast(r)),
  });
}
