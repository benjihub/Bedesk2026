import {ConversationAttachment} from '@app/dashboard/types/conversation-attachment';
import {FilePreviewDialog} from '@common/uploads/components/file-preview/file-preview-dialog';
import {FileTypeIcon} from '@common/uploads/components/file-type-icon/file-type-icon';
import {FileEntryUrlsContext} from '@common/uploads/file-entry-urls';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedBytes} from '@ui/i18n/formatted-bytes';
import {CloseIcon} from '@ui/icons/material/Close';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {ProgressBar} from '@ui/progress/progress-bar';
import clsx from 'clsx';
import {forwardRef, ReactNode} from 'react';

const previewSearchParams = {
  policy: 'conversationFileEntry',
};

interface Props {
  children: ReactNode;
  className?: string;
}
export function ConversationAttachmentListLayout({children, className}: Props) {
  return (
    <FileEntryUrlsContext.Provider value={previewSearchParams}>
      <div className={clsx('flex flex-wrap items-center gap-8', className)}>
        {children}
      </div>
    </FileEntryUrlsContext.Provider>
  );
}

interface AttachmentLayoutProps {
  name: string;
  mime: string;
  size: number | undefined;
  onRemove?: () => void;
  progress?: number;
}
export const AttachmentLayout = forwardRef<
  HTMLDivElement,
  AttachmentLayoutProps
>(({name, mime, size, onRemove, progress, ...htmlProps}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        'relative flex min-h-30 w-max flex-shrink-0 items-center gap-6 rounded-lg border pl-8 transition-opacity',
        ref && 'cursor-pointer hover:bg-hover',
        !onRemove && 'pr-8',
      )}
      {...htmlProps}
    >
      <FileTypeIcon mime={mime} size="xs" />
      <div className="max-w-140 overflow-hidden overflow-ellipsis whitespace-nowrap text-xs font-bold text-muted">
        {name}
      </div>
      {size ? (
        <div className="text-xs text-muted">
          (<FormattedBytes bytes={size} />)
        </div>
      ) : null}
      {onRemove ? (
        <IconButton
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          size="xs"
          className="text-muted"
        >
          <CloseIcon />
        </IconButton>
      ) : null}
      {progress ? (
        <ProgressBar
          value={progress}
          className="absolute bottom-0 left-0 w-full"
          size="xs"
        />
      ) : null}
    </div>
  );
});

interface FileEntryAttachmentLayoutProps {
  attachments: ConversationAttachment[];
  index: number;
  onRemove?: () => void;
}
export function FileEntryAttachmentLayout({
  attachments,
  index,
  onRemove,
}: FileEntryAttachmentLayoutProps) {
  const attachment = attachments[index];
  return (
    <DialogTrigger type="modal">
      <AttachmentLayout
        name={attachment.name}
        mime={attachment.mime}
        size={attachment.file_size}
        onRemove={onRemove}
      />
      <FilePreviewDialog entries={attachments} defaultActiveIndex={index} />
    </DialogTrigger>
  );
}
