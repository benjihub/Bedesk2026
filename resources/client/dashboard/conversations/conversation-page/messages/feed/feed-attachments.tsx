import {FeedBubble} from '@app/dashboard/conversations/conversation-page/messages/feed/feed-bubble';
import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {FileThumbnail} from '@common/uploads/components/file-type-icon/file-thumbnail';
import {FileEntryUrlsContext} from '@common/uploads/file-entry-urls';
import {FormattedBytes} from '@ui/i18n/formatted-bytes';
import {AttachFileIcon} from '@ui/icons/material/AttachFile';
import clsx from 'clsx';
import {useMemo} from 'react';

const basePreviewSearchParams = {
  policy: 'conversationFileEntry',
};

interface Props {
  onSelected?: (file: ConversationAttachment) => void;
  attachments: ConversationAttachment[];
  color: 'chip' | 'primary';
  previewSearchParams?: Record<string, string>;
  align?: 'left' | 'right';
}
export function FeedAttachments({
  attachments,
  color,
  onSelected,
  previewSearchParams,
  align,
}: Props) {
  const images: ConversationAttachment[] = [];
  const files: ConversationAttachment[] = [];
  attachments.forEach(attachment => {
    if (attachment.type === 'image') {
      images.push(attachment);
    } else {
      files.push(attachment);
    }
  });

  const mergedPreviewSearchParams = useMemo(
    () => ({
      ...basePreviewSearchParams,
      ...previewSearchParams,
    }),
    [previewSearchParams],
  );

  return (
    <FileEntryUrlsContext.Provider value={mergedPreviewSearchParams}>
      {images.length > 0 && (
        <div
          className={clsx(
            'flex flex-wrap items-center gap-8',
            align === 'right' && 'justify-end',
          )}
        >
          {images.map(image => (
            <div
              key={image.id}
              className="transition:button flex h-80 w-100 cursor-pointer items-center justify-center overflow-hidden rounded-panel border p-6 hover:bg-hover"
              onClick={() => onSelected?.(image)}
            >
              <FileThumbnail file={image} className="rounded-panel" />
            </div>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div
          className={clsx(
            'flex flex-wrap items-center gap-8',
            align === 'right' && 'justify-end',
          )}
        >
          {files.map(file => (
            <FeedBubble
              key={file.id}
              className="flex cursor-pointer gap-2 underline"
              color={color}
              onClick={() => onSelected?.(file)}
            >
              <AttachFileIcon size="xs" />
              {file.name} (<FormattedBytes bytes={file.file_size} />)
            </FeedBubble>
          ))}
        </div>
      )}
    </FileEntryUrlsContext.Provider>
  );
}
