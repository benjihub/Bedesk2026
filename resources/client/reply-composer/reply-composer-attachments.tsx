import {
  AttachmentLayout,
  ConversationAttachmentListLayout,
  FileEntryAttachmentLayout,
} from '@app/dashboard/conversation-attachment-list-layout';
import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {useFileUploadStore} from '@common/uploads/uploader/file-upload-provider';

interface Props {
  className?: string;
  attachments: ConversationAttachment[];
  onRemove: (attachment: ConversationAttachment) => void;
}
export function ReplyComposerAttachments({
  className,
  attachments,
  onRemove,
}: Props) {
  const uploads = useFileUploadStore(s => s.fileUploads);
  const abortUpload = useFileUploadStore(s => s.abortUpload);

  if (!attachments.length && !uploads.size) return null;

  return (
    <ConversationAttachmentListLayout className={className}>
      {attachments.map((attachment, index) => (
        <FileEntryAttachmentLayout
          key={attachment.id}
          attachments={attachments}
          index={index}
          onRemove={() => onRemove(attachment)}
        />
      ))}
      {[...uploads.entries()]
        .filter(([_, upload]) => upload.status === 'inProgress')
        .map(([id, upload]) => (
          <AttachmentLayout
            key={id}
            size={upload.file.size}
            name={upload.file.name}
            mime={upload.file.mime}
            progress={upload.percentage}
            onRemove={() => abortUpload(id)}
          />
        ))}
    </ConversationAttachmentListLayout>
  );
}
