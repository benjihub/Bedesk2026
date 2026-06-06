import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {useMutation} from '@tanstack/react-query';
import {Localization} from '@ui/i18n/localization';
import {message} from '@ui/i18n/message';
import {toast} from '@ui/toast/toast';
import {UploadedFile} from '@ui/utils/files/uploaded-file';
import {BackendResponse} from '../../http/backend-response/backend-response';
import {apiClient, queryClient} from '../../http/query-client';
import {showHttpErrorToast} from '../../http/show-http-error-toast';

interface Response extends BackendResponse {
  localization: Localization;
}

interface Payload {
  file: UploadedFile;
  localeId: string | number;
}

export function useUploadTranslationFile() {
  return useMutation({
    mutationFn: (payload: Payload) => uploadFile(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: commonAdminQueries.localizations.invalidateKey,
      });
      toast(message('Translation file uploaded'));
    },
    onError: r => showHttpErrorToast(r),
  });
}

function uploadFile({localeId, file}: Payload): Promise<Response> {
  const data = new FormData();
  data.append('file', file.native);
  return apiClient
    .post(`localizations/${localeId}/upload`, data)
    .then(r => r.data);
}
