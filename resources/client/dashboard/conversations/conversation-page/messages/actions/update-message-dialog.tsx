import {useUpdateMessage} from '@app/dashboard/conversations/conversation-page/requests/use-update-message';
import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {ReplyComposerEmojiPickerButton} from '@app/reply-composer/emoji-picker-button';
import {EnhanceTextWithAiButton} from '@app/reply-composer/enhance-text-with-ai-button';
import {InsertInlineImageButton} from '@app/reply-composer/insert-inline-image-button';
import {ReplyComposerAttachments} from '@app/reply-composer/reply-composer-attachments';
import ReplyComposerContainer from '@app/reply-composer/reply-composer-container';
import {ReplyComposerDropTargetMask} from '@app/reply-composer/reply-composer-drop-target';
import {ReplyComposerFooter} from '@app/reply-composer/reply-composer-footer';
import {UploadAttachmentsButton} from '@app/reply-composer/upload-attachments-button';
import {UploadType} from '@app/site-config';
import {useAuth} from '@common/auth/use-auth';
import {FloatingToolbar} from '@common/text-editor/floating-toolbar';
import {TiptapEditorContent} from '@common/text-editor/tiptap-editor-content';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {Button} from '@ui/buttons/button';
import {message as transMessage} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {toast} from '@ui/toast/toast';
import {useState} from 'react';
import {ConversationMessage} from '../conversation-message';

interface Props {
  message: ConversationMessage;
}
export function UpdateMessageDialog({message}: Props) {
  const {close, formId} = useDialogContext();
  const {hasPermission} = useAuth();
  const uploadsDisabled = !hasPermission('files.create');
  const updateReply = useUpdateMessage();
  const [body, setBody] = useState(message.body);
  const [attachments, setAttachments] = useState<ConversationAttachment[]>(
    message.attachments || [],
  );
  const title =
    message.type === 'note' ? (
      <Trans message="Edit note" />
    ) : (
      <Trans message="Edit reply" />
    );

  const handleSubmit = () => {
    updateReply.mutate(
      {
        messageId: message.id,
        body,
        attachments: attachments.map(a => a.id),
      },
      {
        onSuccess: () => {
          close();
          toast(
            message.type === 'note'
              ? transMessage('Updated note')
              : transMessage('Updated reply'),
          );
        },
      },
    );
  };

  const handleUpload = (attachment: ConversationAttachment) => {
    setAttachments([...attachments, attachment]);
  };

  return (
    <Dialog size="lg">
      <DialogHeader>{title}</DialogHeader>
      <DialogBody>
        <FileUploadProvider>
          <ReplyComposerDropTargetMask
            isDisabled={uploadsDisabled}
            onUpload={handleUpload}
          >
            <form
              id={formId}
              onSubmit={e => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <ReplyComposerContainer
                autoFocus="end"
                initialContent={message.body}
                onChange={setBody}
                submitToClosestForm
              >
                <FloatingToolbar />
                <TiptapEditorContent />
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
                  <EnhanceTextWithAiButton />
                </ReplyComposerFooter>
              </ReplyComposerContainer>
            </form>
          </ReplyComposerDropTargetMask>
          <ReplyComposerAttachments
            attachments={attachments}
            onRemove={attachment => {
              setAttachments(attachments.filter(a => a.id !== attachment.id));
            }}
            className="mt-12"
          />
        </FileUploadProvider>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          disabled={updateReply.isPending}
          type="submit"
          form={formId}
        >
          <Trans message="Save" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
