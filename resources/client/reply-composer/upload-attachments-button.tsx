import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {useUploadAttachments} from '@app/reply-composer/use-upload-attachments';
import {UploadType} from '@app/site-config';
import {restrictionsFromConfig} from '@common/uploads/uploader/create-file-upload';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {PaperclipIcon} from '@ui/icons/lucide/paperclip';
import {Tooltip} from '@ui/tooltip/tooltip';
import {openUploadWindow} from '@ui/utils/files/open-upload-window';

interface Props {
  onUpload: (entry: ConversationAttachment) => void;
}
export function UploadAttachmentsButton({onUpload}: Props) {
  const upload = useUploadAttachments({
    onSuccess: entry => {
      onUpload(entry);
    },
  });

  return (
    <Tooltip label={<Trans message="Upload attachments" />}>
      <IconButton
        size="xs"
        iconSize="sm"
        onClick={async () => {
          const restrictions = restrictionsFromConfig({
            uploadType: UploadType.conversationAttachments,
          });
          const files = await openUploadWindow({
            multiple: true,
            types: restrictions?.allowedFileTypes,
          });
          if (files.length) {
            upload(files);
          }
        }}
      >
        <PaperclipIcon />
      </IconButton>
    </Tooltip>
  );
}
