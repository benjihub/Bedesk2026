import {ArticleSearchButton} from '@app/dashboard/conversations/agent-reply-composer/article-search-button';
import {InsertCannedReplyButton} from '@app/dashboard/conversations/agent-reply-composer/insert-canned-reply-button';
import {NewConversationPayload} from '@app/dashboard/conversations/new-conversation-page/new-conversation-payload';
import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {useCannedReplies} from '@app/canned-replies/requests/use-canned-replies';
import {ReplyComposerEmojiPickerButton} from '@app/reply-composer/emoji-picker-button';
import {EnhanceTextWithAiButton} from '@app/reply-composer/enhance-text-with-ai-button';
import {InsertInlineImageButton} from '@app/reply-composer/insert-inline-image-button';
import {ReplyComposerAttachments} from '@app/reply-composer/reply-composer-attachments';
import ReplyComposerContainer from '@app/reply-composer/reply-composer-container';
import {ReplyComposerDropTargetMask} from '@app/reply-composer/reply-composer-drop-target';
import {ReplyComposerFooter} from '@app/reply-composer/reply-composer-footer';
import {UploadAttachmentsButton} from '@app/reply-composer/upload-attachments-button';
import {ReplyComposerPasteAttachmentsListener} from '@app/reply-composer/reply-composer-paste-attachments-listener';
import {UploadType} from '@app/site-config';
import {useAuth} from '@common/auth/use-auth';
import {FloatingToolbar} from '@common/text-editor/floating-toolbar';
import {useCurrentTextEditor} from '@common/text-editor/tiptap-editor-context';
import {TextEditorApi} from '@common/text-editor/tiptap-editor-provider';
import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {Editor} from '@tiptap/react';
import {ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import {useCannedReplyShortcutExpander} from '@app/dashboard/conversations/agent-reply-composer/use-canned-reply-shortcut-expander';
import {Button} from '@ui/buttons/button';
import {Tooltip} from '@ui/tooltip/tooltip';

interface Props {
  errorMessage?: ReactNode;
}
export function MessageField({errorMessage}: Props) {
  const {hasPermission} = useAuth();
  const uploadsDisabled = !hasPermission('files.create');

  const editorApiRef = useRef<TextEditorApi>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  const form = useFormContext<NewConversationPayload>();
  const attachments = useWatch<NewConversationPayload, 'message.attachments'>({
    name: 'message.attachments',
  });

  const handleUpload = (attachment: ConversationAttachment) => {
    form.setValue('message.attachments', [attachment, ...attachments], {
      shouldDirty: true,
    });
  };

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const next = editorApiRef.current?.getEditor() ?? null;
      if (next) {
        setEditor(next);
      } else {
        requestAnimationFrame(tick);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, []);

  useCannedReplyShortcutExpander({editor});

  return (
    <FileUploadProvider>
      <ReplyComposerDropTargetMask
        isDisabled={uploadsDisabled}
        onUpload={handleUpload}
      >
        <ReplyComposerContainer
          ref={editorApiRef}
          autoFocus
          submitToClosestForm
          onChange={value =>
            form.setValue('message.body', value, {shouldDirty: true})
          }
        >
          <FloatingToolbar />
          <ReplyComposerPasteAttachmentsListener onUpload={handleUpload} />
          <ReplyComposerFooter>
            <CannedReplyButton />
            <ArticleSearchButton />
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

function CannedReplyButton() {
  const editor = useCurrentTextEditor();
  const form = useFormContext<NewConversationPayload>();
  const {replies} = useCannedReplies('');

  const applyReply = (reply: any) => {
    editor?.commands.insertContent(reply.body);
    if (reply.attachments?.length) {
      form.setValue('message.attachments', reply.attachments, {
        shouldDirty: true,
      });
    }
  };

  const shortcutReplies = useMemo(() => {
    const withShortcut = replies.filter(r => !!r.shortcut);
    const parseShortcutNum = (value: string) => {
      const m = value.match(/^#(\d+)$/);
      return m ? parseInt(m[1], 10) : null;
    };
    return withShortcut
      .slice()
      .sort((a, b) => {
        const aNum = a.shortcut ? parseShortcutNum(a.shortcut) : null;
        const bNum = b.shortcut ? parseShortcutNum(b.shortcut) : null;
        if (aNum !== null && bNum !== null) return aNum - bNum;
        if (aNum !== null) return -1;
        if (bNum !== null) return 1;
        return (a.shortcut || '').localeCompare(b.shortcut || '');
      })
      .slice(0, 6);
  }, [replies]);

  return (
    <div className="flex items-center gap-6">
      {shortcutReplies.map(reply => (
        <Tooltip key={reply.id} label={reply.name}>
          <Button
            size="xs"
            variant="outline"
            className="px-8"
            onClick={() => applyReply(reply)}
          >
            {reply.shortcut}
          </Button>
        </Tooltip>
      ))}
      <InsertCannedReplyButton onSelected={applyReply} />
    </div>
  );
}
