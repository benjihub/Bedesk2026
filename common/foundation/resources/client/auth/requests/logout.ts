import {useMutation} from '@tanstack/react-query';
import {setBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {message} from '@ui/i18n/message';
import {useSettingsPreviewMode} from '../../admin/settings/preview/use-settings-preview-mode';
import {BackendResponse} from '../../http/backend-response/backend-response';
import {apiClient, queryClient} from '../../http/query-client';
import {showHttpErrorToast} from '../../http/show-http-error-toast';
import {useNavigate} from '../../ui/navigation/use-navigate';

interface Response extends BackendResponse {
  bootstrapData: string;
}

const appearanceMessage = "Can't logout while in appearance editor.";

export function useLogout() {
  const navigate = useNavigate();
  const {isInsideSettingsPreview: isAppearanceEditorActive} =
    useSettingsPreviewMode();
  return useMutation({
    mutationFn: () => (isAppearanceEditorActive ? noopLogout() : logout()),
    onSuccess: response => {
      // need to update bootstrap data in order for redirect to login page to work
      setBootstrapData(response.bootstrapData);
      queryClient.clear();
      navigate('/login');

      // need to clear query client and then set bootstrap data again immediately,
      // because there's no way to clear everything except one in react query
      queryClient.clear();
      setBootstrapData(response.bootstrapData);
    },
    onError: err =>
      showHttpErrorToast(
        err,
        isAppearanceEditorActive ? message(appearanceMessage) : undefined,
      ),
  });
}

function logout(): Promise<Response> {
  return apiClient.post('auth/logout').then(r => r.data);
}

function noopLogout() {
  return Promise.reject(appearanceMessage);
}
