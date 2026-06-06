import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {UploadType} from '@app/site-config';
import {useFileUploadStore} from '@common/uploads/uploader/file-upload-provider';
import {toast} from '@ui/toast/toast';
import {UploadedFile} from '@ui/utils/files/uploaded-file';
import {useCallback, useRef} from 'react';

interface Props {
  onSuccess: (entry: ConversationAttachment) => void;
}
export function useUploadAttachments({onSuccess}: Props) {
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const uploadMultiple = useFileUploadStore(s => s.uploadMultiple);
  return useCallback(
    (files: UploadedFile[]) => {
      uploadMultiple(files, {
        showToastOnRestrictionFail: true,
        uploadType: UploadType.conversationAttachments,
        onSuccess: entry => {
          onSuccessRef.current(entry);
        },
        onError: message => {
          if (message) {
            toast.danger(message);
          }
        },
      });
    },
    [uploadMultiple],
  );
}
