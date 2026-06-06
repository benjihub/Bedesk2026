import {EmojiPickerButton} from '@app/reply-composer/emoji-picker-button';
import {useSettingsPreviewMode} from '@common/admin/settings/preview/use-settings-preview-mode';
import {useAuth} from '@common/auth/use-auth';
import {FileEntry} from '@common/uploads/file-entry';
import {useFileUploadStore} from '@common/uploads/uploader/file-upload-provider';
import {UploadType} from '@app/site-config';
import {ChatUploadFileButton} from '@livechat/widget/chat/text-editor/chat-upload-file-button';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {SendIcon} from '@ui/icons/material/Send';
import {useSettings} from '@ui/settings/use-settings';
import {Tooltip} from '@ui/tooltip/tooltip';
import {useEffect, useRef, useState} from 'react';
import {useDebouncedCallback} from 'use-debounce';
import {apiClient} from '@common/http/query-client';

export interface WidgetChatTextEditorPayload {
  body: string;
  attachments: FileEntry[];
}

interface Props {
  isPending: boolean;
  onSubmit: (data: WidgetChatTextEditorPayload) => void;
  conversationId?: number | string;
}
export function WidgetChatTextEditor({isPending, onSubmit, conversationId}: Props) {
  const {hasPermission} = useAuth();
  const uploadsDisabled = !hasPermission('files.create');
  const {isInsideSettingsPreview} = useSettingsPreviewMode();
  const {chatWidget} = useSettings();
  const getCompletedUploads = useFileUploadStore(
    s => s.getCompletedFileEntries,
  );
  const clearInactiveUploads = useFileUploadStore(s => s.clearInactive);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState('');
  const {trans} = useTrans();
  const uploadMultiple = useFileUploadStore(s => s.uploadMultiple);
  const uploadConfig = {uploadType: UploadType.conversationAttachments};
  const {startTyping, stopTyping} = useSendTypingInternal(
    isInsideSettingsPreview ? undefined : conversationId,
  );

  // send typing signal while user is entering text
  useEffect(() => {
    if (!conversationId || isInsideSettingsPreview) return;
    if (value.trim().length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [value, conversationId, isInsideSettingsPreview, startTyping, stopTyping]);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  const handleSubmit = async () => {
    // Allow multiple messages while a request is pending *for existing conversations*.
    // But keep blocking during initial chat creation to avoid accidentally creating
    // multiple conversations.
    if (isPending && !conversationId) return;

    const attachments = getCompletedUploads();
    if (value.trim().length === 0 && attachments.length === 0) return;
    if (!isInsideSettingsPreview) {
      stopTyping();
      onSubmit({
        body: value,
        attachments,
      });

      setValue('');
      clearInactiveUploads();
    } else {
      setValue('');
      clearInactiveUploads();
    }
  };

  return (
    <form
      ref={formRef}
      className="m-0 flex-shrink-0"
      onSubmit={e => {
        e.stopPropagation();
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div
        ref={inputContainerRef}
        className="relative overflow-hidden rounded-[22px] bg-elevated shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-shadow focus-within:shadow-[0_2px_8px_rgba(0,0,0,0.16)] dark:shadow-[0_1px_4px_rgba(255,255,255,0.1)]"
      >
        <div className="relative max-h-[6em] min-h-44 min-w-0 flex-auto">
          <textarea
            required
            className="compact-scrollbar absolute inset-0 max-h-inherit resize-none border-none bg-transparent py-12 pl-16 pr-96 text-[14px] text outline-none"
            value={value}
            rows={1}
            onChange={e => setValue(e.target.value)}
            onBlur={() => stopTyping()}
            placeholder={trans({
              message:
                chatWidget?.inputPlaceholder ?? 'Enter your message here...',
            })}
            onPaste={e => {
              if (uploadsDisabled) return;
              const items = e.clipboardData.items;
              const files: File[] = [];
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file') {
                  const file = item.getAsFile();
                  if (file && file.type.startsWith('image/')) {
                    files.push(file);
                  }
                }
              }
              if (files.length) {
                e.preventDefault();
                uploadMultiple(files, uploadConfig);
              }
            }}
            onKeyDown={e => {
              if (e.key !== 'Enter') return;

              // Allow multi-line messages
              if (e.shiftKey) return;

              // Don't hijack IME composition (e.g. Japanese input)
              if (e.nativeEvent.isComposing) return;

              // Send on plain Enter
              e.preventDefault();
              handleSubmit();
            }}
          />
          <div className="invisible max-h-inherit whitespace-pre-line py-12 pl-16 pr-96 text-[14px]">
            {value}
          </div>
        </div>
        <div className="absolute bottom-0 right-0 top-0 flex items-end px-6 pb-6">
          <EmojiPickerButton
            onSelected={emoji => setValue(value + emoji)}
            className="text-muted"
            size="sm"
          />
          {!uploadsDisabled && (
            <ChatUploadFileButton
              inputContainerRef={inputContainerRef}
              className="text-muted"
              size="sm"
              disabled={isInsideSettingsPreview}
            />
          )}
          <Tooltip label={<Trans message="Submit" />}>
            <IconButton
              disabled={(isPending && !conversationId) || isInsideSettingsPreview}
              type="submit"
              size="sm"
              color="primary"
            >
              <SendIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </form>
  );
}

// Local hook to send typing signals without relying on external path resolution
function useSendTypingInternal(conversationId?: number | string) {
  const send = useDebouncedCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;
      apiClient
        .post(`lc/widget/chats/${conversationId}/typing`, {
          is_typing: isTyping,
        })
        .catch(() => {
          // best-effort only
        });
    },
    250,
    {maxWait: 1500},
  );

  const startTyping = () => send(true);
  const stopTyping = () => send(false);

  return {startTyping, stopTyping};
}
