import {UploadType} from '@app/site-config';
import {restrictionsFromConfig} from '@common/uploads/uploader/create-file-upload';
import {useFileUploadStore} from '@common/uploads/uploader/file-upload-provider';
import {ChatUploadsDialog} from '@livechat/widget/chat/text-editor/chat-uploads-dialog';
import {Badge} from '@ui/badge/badge';
import {IconButton, IconButtonProps} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {AttachFileIcon} from '@ui/icons/material/AttachFile';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Tooltip} from '@ui/tooltip/tooltip';
import {openUploadWindow} from '@ui/utils/files/open-upload-window';
import {Fragment, RefObject, useState} from 'react';

interface Props {
  className?: string;
  size?: IconButtonProps['size'];
  iconSize?: IconButtonProps['iconSize'];
  maxUploads?: number;
  disabled?: boolean;
  inputContainerRef?: RefObject<HTMLElement | null>;
}
export function ChatUploadFileButton({
  className,
  size,
  iconSize,
  maxUploads = 6,
  disabled,
  inputContainerRef,
}: Props) {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const completedUploadsCount = useFileUploadStore(
    s => s.completedUploadsCount,
  );
  const haveAnyUploads = useFileUploadStore(s => s.fileUploads.size > 0);
  const uploadMultiple = useFileUploadStore(s => s.uploadMultiple);
  const uploadConfig = {
    uploadType: UploadType.conversationAttachments,
  };

  return (
    <Fragment>
      <DialogTrigger
        type="popover"
        mobileType="popover"
        isOpen={dialogIsOpen}
        onOpenChange={isOpen => setDialogIsOpen(isOpen)}
        usePortal={false}
        placement="top"
        offset={14}
        handleTriggerClick={false}
        triggerRef={inputContainerRef}
      >
        <Tooltip label={<Trans message="Upload a file" />}>
          <IconButton
            badge={
              completedUploadsCount ? (
                <Badge top="-top-2" right="right-2">
                  {completedUploadsCount}
                </Badge>
              ) : undefined
            }
            onClick={async e => {
              e.stopPropagation();
              if (dialogIsOpen) {
                setDialogIsOpen(false);
              } else {
                if (!haveAnyUploads) {
                  const restrictions = restrictionsFromConfig(uploadConfig);
                  const files = await openUploadWindow({
                    multiple: true,
                    types: restrictions?.allowedFileTypes,
                  });
                  uploadMultiple(files.slice(0, maxUploads - 1), uploadConfig);
                }
                setDialogIsOpen(true);
              }
            }}
            disabled={disabled}
            size={size}
            className={className}
            iconSize={iconSize}
          >
            <AttachFileIcon className="rotate-[30deg]" />
          </IconButton>
        </Tooltip>
        <ChatUploadsDialog
          maxUploads={maxUploads}
          onClose={() => setDialogIsOpen(false)}
          onSelectFiles={() => {
            setDialogIsOpen(false);
          }}
        />
      </DialogTrigger>
    </Fragment>
  );
}
