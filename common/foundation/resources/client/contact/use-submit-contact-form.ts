import {useMutation} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useTrans} from '@ui/i18n/use-trans';
import {toast} from '@ui/toast/toast';
import {UseFormReturn} from 'react-hook-form';
import {onFormQueryError} from '../errors/on-form-query-error';
import {BackendResponse} from '../http/backend-response/backend-response';
import {apiClient} from '../http/query-client';
import {useNavigate} from '../ui/navigation/use-navigate';

interface Response extends BackendResponse {}

export interface ContactPagePayload {
  name: string;
  email: string;
  message: string;
  captcha_token: string | null;
}

export function useSubmitContactForm(form: UseFormReturn<ContactPagePayload>) {
  const {trans} = useTrans();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (props: ContactPagePayload) => submitContactForm(props),
    onSuccess: () => {
      toast(trans(message('Your message has been submitted.')));
      navigate('/');
    },
    onError: err => onFormQueryError(err, form),
  });
}

function submitContactForm(payload: ContactPagePayload): Promise<Response> {
  return apiClient.post('contact-page', payload).then(r => r.data);
}
