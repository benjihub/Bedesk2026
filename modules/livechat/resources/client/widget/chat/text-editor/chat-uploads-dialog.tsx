import {UploadType} from '@app/site-config';
import {FileThumbnail} from '@common/uploads/components/file-type-icon/file-thumbnail';
import {FileEntryUrlsContext} from '@common/uploads/file-entry-urls';
import {restrictionsFromConfig} from '@common/uploads/uploader/create-file-upload';
import {useFileUploadStore} from '@common/uploads/uploader/file-upload-provider';
import {getWidgetBootstrapData} from '@livechat/widget/hooks/use-widget-bootstrap-data';
import {FileUpload} from '@common/uploads/uploader/file-upload-store';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {message} from '@ui/i18n/message';
import {MixedText} from '@ui/i18n/mixed-text';
import {Trans} from '@ui/i18n/trans';
import {CheckCircleFilledIcon} from '@ui/icons/check-circle-filled';
import {AddIcon} from '@ui/icons/material/Add';
import {CheckCircleIcon} from '@ui/icons/material/CheckCircle';
import {CloseIcon} from '@ui/icons/material/Close';
import {ErrorIcon} from '@ui/icons/material/Error';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {WarningIcon} from '@ui/icons/material/Warning';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {Tooltip} from '@ui/tooltip/tooltip';
import {openUploadWindow} from '@ui/utils/files/open-upload-window';
import {
  UploadedFile,
  UploadedFileFromEntry,
} from '@ui/utils/files/uploaded-file';
import {ReactElement} from 'react';

const previewSearchParams = {
  policy: 'conversationFileEntry',
  _xChatWidget: 'true',
  _widget_auth: getWidgetBootstrapData().widgetAuthToken || '',
};

interface Props {
  onClose: () => void;
  onSelectFiles: () => void;
  maxUploads: number;
}
export function ChatUploadsDialog({onClose, onSelectFiles, maxUploads}: Props) {
  const uploads = useFileUploadStore(s => s.fileUploads);
  const completedUploadsCount = useFileUploadStore(
    s => s.completedUploadsCount,
  );
  const activeUploadsCount = useFileUploadStore(s => s.activeUploadsCount);
  const uploadMultiple = useFileUploadStore(s => s.uploadMultiple);
  const uploadConfig = {
    uploadType: UploadType.conversationAttachments,
  };

  return (
    <Dialog maxHeight="max-h-400" shadow="shadow-lg">
      <DialogHeader
        showDivider
        titleTextSize="text-sm"
        padding="px-14 py-10"
        leftAdornment={
          activeUploadsCount ? (
            <ProgressCircle isIndeterminate size="sm" />
          ) : (
            <CheckCircleFilledIcon className="text-positive" />
          )
        }
        closeButtonIcon={<KeyboardArrowDownIcon />}
      >
        <Trans
          message=":completed of :total uploaded"
          values={{completed: completedUploadsCount, total: uploads.size}}
        />
      </DialogHeader>
      <DialogBody padding="p-14" className="@container">
        <div className="mb-12 grid grid-cols-3 gap-10 @[400px]:grid-cols-4">
          {uploads.size < maxUploads && (
            <IconButton
              equalWidth
              color="primary"
              variant="outline"
              radius="rounded-panel"
              size={null}
              className="aspect-square"
              onClick={async () => {
                const restrictions = restrictionsFromConfig(uploadConfig);
                const files = await openUploadWindow({
                  multiple: true,
                  types: restrictions?.allowedFileTypes,
                });
                uploadMultiple(files, uploadConfig);
              }}
            >
              <AddIcon />
            </IconButton>
          )}
          <FileEntryUrlsContext.Provider value={previewSearchParams}>
            {[...uploads].map(([id, upload]) => (
              <FileGridItem
                key={id}
                upload={upload}
                uploadCount={uploads.size}
                onClose={onClose}
              />
            ))}
          </FileEntryUrlsContext.Provider>
        </div>
        <Button
          variant="flat"
          color="primary"
          className="w-full"
          onClick={() => onSelectFiles()}
          disabled={!completedUploadsCount || activeUploadsCount > 0}
        >
          <Trans message="Select files" />
        </Button>
      </DialogBody>
    </Dialog>
  );
}

interface FileGridItemProps {
  upload: FileUpload;
  uploadCount: number;
  onClose: () => void;
}
function FileGridItem({upload, onClose, uploadCount}: FileGridItemProps) {
  const abortUpload = useFileUploadStore(s => s.abortUpload);
  const removeUpload = useFileUploadStore(s => s.removeUpload);

  return (
    <div className="relative flex aspect-square min-h-0 flex-col rounded-panel border px-6 pb-4 pt-6">
      <div className="m-4 flex min-h-0 flex-auto items-center justify-center overflow-hidden">
        {upload.entry ? (
          <FileThumbnail file={upload.entry} className="rounded-panel" />
        ) : (
          <InProgressUploadThumbnail file={upload.file} />
        )}
      </div>
      <div className="mt-6 flex-shrink-0 overflow-hidden overflow-ellipsis whitespace-nowrap text-center text-xs">
        {upload.file.name}
      </div>
      <IconButton
        className="absolute -right-8 -top-8"
        variant="flat"
        radius="rounded-full"
        color="chip"
        size="2xs"
        onClick={() => {
          abortUpload(upload.file.id);
          removeUpload(upload.file.id);
          if (uploadCount < 2) {
            onClose();
          }
        }}
      >
        <CloseIcon />
      </IconButton>
    </div>
  );
}

interface InProgressUploadThumbnailProps {
  file: UploadedFile | UploadedFileFromEntry;
}
function InProgressUploadThumbnail({file}: InProgressUploadThumbnailProps) {
  const fileUpload = useFileUploadStore(s => s.fileUploads.get(file.id));
  const percentage = fileUpload?.percentage || 0;
  const status = fileUpload?.status;
  const errorMessage = fileUpload?.errorMessage;

  let statusEl: ReactElement;
  if (status === 'failed') {
    const errMessage =
      errorMessage || message('This file could not be uploaded');
    statusEl = (
      <Tooltip variant="danger" label={<MixedText value={errMessage} />}>
        <ErrorIcon className="text-danger" size="md" />
      </Tooltip>
    );
  } else if (status === 'aborted') {
    statusEl = <WarningIcon className="text-warning" size="md" />;
  } else if (status === 'completed') {
    statusEl = <CheckCircleIcon size="md" className="text-positive" />;
  } else {
    statusEl = (
      <ProgressCircle
        aria-label="Upload progress"
        size="sm"
        value={percentage}
        isIndeterminate={percentage < 1 || percentage > 99}
      />
    );
  }

  return (
    <div className="flex flex-auto items-center justify-center">{statusEl}</div>
  );
}
