import {useMutation} from '@tanstack/react-query';
import {
  getBootstrapData,
  setBootstrapData,
} from '@ui/bootstrap-data/bootstrap-data-store';
import {useCallback} from 'react';
import {UseFormReturn} from 'react-hook-form';
import {onFormQueryError} from '../../errors/on-form-query-error';
import {BackendResponse} from '../../http/backend-response/backend-response';
import {apiClient} from '../../http/query-client';
import {useNavigate} from '../../ui/navigation/use-navigate';
import {useAuth} from '../use-auth';

interface LoginResponse extends BackendResponse {
  bootstrapData: string;
  two_factor: false;
  url?: {
    intended?: string;
  };
}
interface TwoFactorResponse {
  two_factor: true;
}

type Response = LoginResponse | TwoFactorResponse;

export interface LoginPayload {
  email: string;
  password: string;
  remember: boolean;
  token_name: string;
}

export function useLogin(form: UseFormReturn<LoginPayload>) {
  const handleSuccess = useHandleLoginSuccess();
  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      apiClient
        .post<Response>('auth/login', payload)
        .then(response => response.data),
    onSuccess: response => {
      if (!response.two_factor) {
        handleSuccess(response);
      }
    },
    onError: r => onFormQueryError(r, form),
  });
}

export function useHandleLoginSuccess() {
  const navigate = useNavigate();
  const {getRedirectUri} = useAuth();

  return useCallback(
    (response: LoginResponse) => {
      let redirectUri = response.url?.intended ?? getRedirectUri();
      if (redirectUri.includes('/oauth/')) {
        window.location.href = redirectUri;
      } else {
        setBootstrapData(response.bootstrapData);
        // get redirect uri after setting bootstrap data so it includes the new url from bootstrap data
        redirectUri = response.url?.intended ?? getRedirectUri();
        const relativeRedirectUri = redirectUri.replace(
          getBootstrapData().settings.base_url,
          '',
        );
        navigate(relativeRedirectUri, {replace: true});
      }
    },
    [navigate, getRedirectUri],
  );
}
