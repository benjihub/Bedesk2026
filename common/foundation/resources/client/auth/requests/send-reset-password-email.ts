import {useMutation} from '@tanstack/react-query';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';
import {onFormQueryError} from '../../errors/on-form-query-error';
import {BackendResponse} from '../../http/backend-response/backend-response';
import {apiClient} from '../../http/query-client';
import {useNavigate} from '../../ui/navigation/use-navigate';

interface Response extends BackendResponse {
  message: string;
}

export interface SendPasswordResetEmailPayload {
  email: string;
}

export function useSendPasswordResetEmail(
  form: UseFormReturn<SendPasswordResetEmailPayload>,
) {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: sendResetPasswordEmail,
    onSuccess: response => {
      toast(response.message);
      navigate('/login');
    },
    onError: r => onFormQueryError(r, form),
  });
}

function sendResetPasswordEmail(
  payload: SendPasswordResetEmailPayload,
): Promise<Response> {
  return apiClient
    .post('auth/forgot-password', payload)
    .then(response => response.data);
}
