import {
  ConversationAttachmentListLayout,
  FileEntryAttachmentLayout,
} from '@app/dashboard/conversation-attachment-list-layout';
import {useUpdateMessage} from '@app/dashboard/conversations/conversation-page/requests/use-update-message';
import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {openDialog} from '@ui/overlays/store/dialog-store';

interface Props {
  replyId: number | undefined;
  attachments: ConversationAttachment[];
}
export function MessageAttachments({replyId, attachments}: Props) {
  if (!attachments.length) return null;
  return (
    <ConversationAttachmentListLayout className="mt-20 w-max">
      {attachments.map((attachment, index) => (
        <FileEntryAttachmentLayout
          key={attachment.id}
          attachments={attachments}
          index={index}
          onRemove={
            replyId
              ? () => {
                  openDialog(DeleteAttachmentDialog, {
                    replyId,
                    attachmentId: attachment.id,
                    attachments,
                  });
                }
              : undefined
          }
        />
      ))}
    </ConversationAttachmentListLayout>
  );
}

interface DeleteAttachmentDialogProps {
  messageId: number;
  attachmentId: number;
  attachments: ConversationAttachment[];
  onSuccess?: () => void;
}
export function DeleteAttachmentDialog({
  messageId,
  attachmentId,
  attachments,
  onSuccess,
}: DeleteAttachmentDialogProps) {
  const updateMessage = useUpdateMessage();
  const {close} = useDialogContext();
  return (
    <ConfirmationDialog
      isDanger
      title={<Trans message="Delete attachment" />}
      body={
        <Trans message="Are you sure you want to delete this attachment?" />
      }
      confirm={<Trans message="Delete" />}
      onConfirm={() => {
        updateMessage.mutate(
          {
            messageId,
            attachments: attachments
              .filter(u => u.id !== attachmentId)
              .map(u => u.id),
          },
          {
            onSuccess: () => {
              onSuccess?.();
              close();
            },
          },
        );
      }}
      isLoading={updateMessage.isPending}
    />
  );
}
