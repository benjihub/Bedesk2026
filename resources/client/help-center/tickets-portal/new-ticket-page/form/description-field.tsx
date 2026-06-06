import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {CreateTicketAsCustomerPayload} from '@app/help-center/tickets-portal/new-ticket-page/create-ticket-as-customer-payload';
import {ReplyComposerEmojiPickerButton} from '@app/reply-composer/emoji-picker-button';
import {InsertInlineImageButton} from '@app/reply-composer/insert-inline-image-button';
import {ReplyComposerAttachments} from '@app/reply-composer/reply-composer-attachments';
import ReplyComposerContainer from '@app/reply-composer/reply-composer-container';
import {ReplyComposerDropTargetMask} from '@app/reply-composer/reply-composer-drop-target';
import {ReplyComposerFooter} from '@app/reply-composer/reply-composer-footer';
import {UploadAttachmentsButton} from '@app/reply-composer/upload-attachments-button';
import {UploadType} from '@app/site-config';
import {useAuth} from '@common/auth/use-auth';
import {FloatingToolbar} from '@common/text-editor/floating-toolbar';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {ReactNode} from 'react';
import {useFormContext} from 'react-hook-form';

interface Props {
  attachments: ConversationAttachment[];
  errorMessage?: ReactNode;
}
export function DescriptionField({attachments, errorMessage}: Props) {
  const {hasPermission} = useAuth();
  const uploadsDisabled = !hasPermission('files.create');
  const form = useFormContext<CreateTicketAsCustomerPayload>();

  const handleUpload = (attachment: ConversationAttachment) => {
    form.setValue('message.attachments', [attachment, ...attachments], {
      shouldDirty: true,
    });
  };

  return (
    <FileUploadProvider>
      <ReplyComposerDropTargetMask
        isDisabled={uploadsDisabled}
        onUpload={handleUpload}
      >
        <ReplyComposerContainer
          submitToClosestForm
          autoFocus={false}
          onChange={value =>
            form.setValue('message.body', value, {shouldDirty: true})
          }
        >
          <FloatingToolbar />
          <ReplyComposerFooter>
            <ReplyComposerEmojiPickerButton />
            {!uploadsDisabled && (
              <UploadAttachmentsButton onUpload={handleUpload} />
            )}
            {!uploadsDisabled && (
              <InsertInlineImageButton
                uploadType={UploadType.conversationImages}
              />
            )}
          </ReplyComposerFooter>
        </ReplyComposerContainer>
      </ReplyComposerDropTargetMask>
      {errorMessage}
      <ReplyComposerAttachments
        className="mt-12"
        attachments={attachments}
        onRemove={attachment => {
          form.setValue(
            'message.attachments',
            attachments.filter(a => a.id !== attachment.id),
            {shouldDirty: true},
          );
        }}
      />
    </FileUploadProvider>
  );
}
