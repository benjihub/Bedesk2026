import {replaceVariables} from '@app/attributes/attribute-selector/replace-variables';
import {ConversationCategoryAttribute} from '@app/attributes/compact-attribute';
import {FullConversationResponse} from '@app/dashboard/conversation';
import {useAgentReplyComposerStore} from '@app/dashboard/conversations/agent-reply-composer/agent-reply-composer-store';
import {ArticleSearchButton} from '@app/dashboard/conversations/agent-reply-composer/article-search-button';
import {InsertCannedReplyButton} from '@app/dashboard/conversations/agent-reply-composer/insert-canned-reply-button';
import {MessageTypeSelector} from '@app/dashboard/conversations/agent-reply-composer/message-type-selector';
import {SubmitReplyButtons} from '@app/dashboard/conversations/agent-reply-composer/submit-reply-buttons';
import {useSubmitAgentReply} from '@app/dashboard/conversations/agent-reply-composer/use-submit-agent-reply';
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
import {useCannedReplies} from '@app/canned-replies/requests/use-canned-replies';
import {Button} from '@ui/buttons/button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {ChipList} from '@ui/forms/input-field/chip-field/chip-list';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import {useEffect, useRef} from 'react';
import {useDebouncedCallback} from 'use-debounce';
import {apiClient} from '@common/http/query-client';
import {Editor} from '@tiptap/react';
import {useState} from 'react';
import {useCannedReplyShortcutExpander} from '@app/dashboard/conversations/agent-reply-composer/use-canned-reply-shortcut-expander';
import {useMemo} from 'react';
import {statusCategory} from '@app/dashboard/statuses/status-category';

export interface Props {
  data: FullConversationResponse;
}
export function AgentReplyComposer({data}: Props) {
  const {hasPermission} = useAuth();
  const uploadsDisabled = !hasPermission('files.create');
  const isClosed =
    data.conversation.status_category <= statusCategory.closed;
  const editorApiRef = useRef<TextEditorApi>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const updateDraft = useAgentReplyComposerStore(s => s.updateDraft);
  const submitReply = useSubmitAgentReply(data.conversation);
  const draft = useAgentReplyComposerStore(s => s.draft);
  const messageType = useAgentReplyComposerStore(s => s.messageType);
  const addAttachment = useAgentReplyComposerStore(s => s.addAttachment);
  const removeAttachment = useAgentReplyComposerStore(s => s.removeAttachment);
  const {startTyping, stopTyping} = useSendTypingInternal(data.conversation.id);

  useEffect(() => {
    if (isClosed) {
      stopTyping();
      return;
    }
    if (draft.body.trim().length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [draft.body, isClosed, startTyping, stopTyping]);

  useEffect(() => {
    return () => stopTyping();
  }, [stopTyping]);

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

  useCannedReplyShortcutExpander({
    editor,
    transformBody: body => replaceVariables(body, data),
  });

  const handleSubmit = () => {
    if (isClosed) return;
    stopTyping();
    submitReply.mutate(undefined, {
      onSuccess: () => editorApiRef.current?.clearContents(),
    });
  };

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      {isClosed && (
        <div className="mx-16 mt-16 rounded-md border bg-muted/50 px-12 py-8 text-sm text-muted-foreground">
          This ticket is closed. Agents can no longer send messages.
        </div>
      )}
      <ReplyComposerDropTargetMask
        isDisabled={uploadsDisabled || isClosed}
        onUpload={addAttachment}
      >
        <ReplyComposerContainer
          ref={editorApiRef}
          initialContent={draft.body}
          height="max-h-[50vh] min-h-[180px]"
          onChange={value => updateDraft({body: value})}
          editable={!isClosed}
          className={clsx(
            'mx-16 my-16',
            messageType === 'note' && 'bg-warning/15',
          )}
          header={<MessageTypeSelector />}
          submitToClosestForm
        >
          <FloatingToolbar />
          <ReplyComposerPasteAttachmentsListener onUpload={addAttachment} />
          <ReplyComposerAttachments
            className="mb-2 mt-24 px-12"
            attachments={draft.attachments}
            onRemove={removeAttachment}
          />
          <TagList />
          <ReplyComposerFooter
            submitButtons={
              <SubmitReplyButtons
                conversation={data.conversation}
                disabled={isClosed}
              />
            }
          >
            {!isClosed && (
              <>
                <CannedReplyButton data={data} />
                <ReplyComposerEmojiPickerButton />
                <ConversationArticleSearchButton data={data} />
                {!uploadsDisabled && (
                  <UploadAttachmentsButton onUpload={addAttachment} />
                )}
                {!uploadsDisabled && (
                  <InsertInlineImageButton
                    uploadType={UploadType.conversationImages}
                  />
                )}
                <EnhanceTextWithAiButton disabled={!draft.body.length} />
              </>
            )}
          </ReplyComposerFooter>
        </ReplyComposerContainer>
      </ReplyComposerDropTargetMask>
    </form>
  );
}

function useSendTypingInternal(conversationId?: number | string) {
  const send = useDebouncedCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;
      apiClient
        .post(`helpdesk/agent/conversations/${conversationId}/typing`, {
          is_typing: isTyping,
        })
        .catch(() => {
          // best-effort
        });
    },
    250,
    {maxWait: 1500},
  );

  const startTyping = () => send(true);
  const stopTyping = () => send(false);

  return {startTyping, stopTyping};
}

export function CannedReplyButton({data}: Props) {
  const editor = useCurrentTextEditor();
  const draft = useAgentReplyComposerStore(s => s.draft);
  const updateDraft = useAgentReplyComposerStore(s => s.updateDraft);
  const {replies} = useCannedReplies('');

  const applyReply = (reply: any) => {
    editor?.commands.insertContent(replaceVariables(reply.body, data));
    setTimeout(() => {
      editor?.commands.focus();
    }, 170);
    updateDraft(reply);
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
      <InsertCannedReplyButton
        onSelected={applyReply}
        getInitialData={() => ({
          body: draft.body,
          attachments: draft.attachments,
          tags: draft.tags,
        })}
      />
    </div>
  );
}

function TagList() {
  const tags = useAgentReplyComposerStore(s => s.draft.tags);
  const removeTag = useAgentReplyComposerStore(s => s.removeTag);

  if (!tags?.length) {
    return null;
  }

  return (
    <ChipList size="xs" className="mb-2 mt-12 px-12">
      {tags.map(tag => (
        <Chip key={tag.id} onRemove={() => removeTag(tag)}>
          {tag.name}
        </Chip>
      ))}
    </ChipList>
  );
}

function ConversationArticleSearchButton({data}: Props) {
  // if conversation has category attributes, get help center categories attached
  const category = data.attributes?.find(c => c.key === 'category') as
    | (ConversationCategoryAttribute & {value?: string})
    | null;
  const hcCategoryId = category?.value
    ? category.config?.options?.find(o => o.value === category.value)
        ?.hcCategories?.[0]
    : undefined;

  return (
    <ArticleSearchButton
      categoryIds={hcCategoryId ? [hcCategoryId] : undefined}
    />
  );
}
