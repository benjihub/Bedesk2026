import {BackendResponse} from '@common/http/backend-response/backend-response';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {
  getBootstrapData,
  mergeBootstrapData,
} from '@ui/bootstrap-data/bootstrap-data-store';
import {Localization} from '@ui/i18n/localization';

interface ChangeLocaleResponse extends BackendResponse {
  locale: Localization;
}

export function useChangeLocale() {
  return useMutation({
    mutationFn: (props: {locale?: string}) =>
      apiClient
        .post<ChangeLocaleResponse>(`users/me/locale`, props)
        .then(r => r.data),
    onSuccess: response => {
      mergeBootstrapData({
        i18n: {
          locales: getBootstrapData().i18n.locales,
          active: response.locale.language,
        },
      });
    },
    onError: err => showHttpErrorToast(err),
  });
}
