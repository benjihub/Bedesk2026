import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {useFlowEditorStore} from '@ai/ai-agent/flows/flow-editor/store/flow-editor-store-provider';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {FileThumbnail} from '@common/uploads/components/file-type-icon/file-thumbnail';
import {useFileUploadStore} from '@common/uploads/uploader/file-upload-provider';
import {useQuery} from '@tanstack/react-query';
import {IconButton} from '@ui/buttons/icon-button';
import {message} from '@ui/i18n/message';
import {MixedText} from '@ui/i18n/mixed-text';
import {CheckCircleIcon} from '@ui/icons/material/CheckCircle';
import {CloseIcon} from '@ui/icons/material/Close';
import {ErrorIcon} from '@ui/icons/material/Error';
import {FilePresentIcon} from '@ui/icons/material/FilePresent';
import {WarningIcon} from '@ui/icons/material/Warning';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {Tooltip} from '@ui/tooltip/tooltip';
import {
  UploadedFile,
  UploadedFileFromEntry,
} from '@ui/utils/files/uploaded-file';
import {Fragment, ReactElement, ReactNode} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import {useShallow} from 'zustand/react/shallow';

type PartialFormValue = {
  attachmentIds: number[];
};

export function AttachmentPreviewGrid() {
  return (
    <div className="mb-24 mt-12 grid grid-cols-4 gap-10 empty:hidden">
      <AttachmentGridItems />
      <UploadGridItems />
    </div>
  );
}

function AttachmentGridItems() {
  const {flowId} = useRequiredParams(['flowId']);
  const form = useFormContext<PartialFormValue>();
  const query = useQuery(aiAgentQueries.flows.indexAttachments(flowId));
  const attachments = query.data?.attachments ?? [];

  const attachmentIds =
    useWatch<PartialFormValue, 'attachmentIds'>({
      name: 'attachmentIds',
    }) ?? [];

  const removeAttachment = (attachmentId: number) => {
    const attachmentIds = form.getValues('attachmentIds');
    form.setValue(
      'attachmentIds',
      attachmentIds.filter(id => id !== attachmentId),
    );
  };

  return (
    <Fragment>
      {attachmentIds.map(id => {
        const attachment = attachments.find(a => a.id === id);
        return (
          <GridItemLayout
            key={id}
            thumbnail={
              attachment ? (
                <FileThumbnail file={attachment} className="rounded-panel" />
              ) : (
                <FilePresentIcon />
              )
            }
            name={attachment?.name ?? 'Unknown'}
            onRemove={() =>
              attachment ? removeAttachment(attachment.id) : undefined
            }
          />
        );
      })}
    </Fragment>
  );
}

function UploadGridItems() {
  const abortUpload = useFileUploadStore(s => s.abortUpload);
  const removeUpload = useFileUploadStore(s => s.removeUpload);
  const nodeId = useFlowEditorStore(s => s.selectedNodeId);
  const uploads = useFileUploadStore(
    useShallow(s =>
      [...s.fileUploads.values()]
        .filter(upload => upload.options.metadata?.nodeId === nodeId)
        .map(u => u.file),
    ),
  );

  return (
    <Fragment>
      {uploads.map(upload => (
        <GridItemLayout
          key={upload.id}
          thumbnail={<InProgressUploadThumbnail file={upload} />}
          name={upload.name}
          onRemove={() => {
            abortUpload(upload.id);
            removeUpload(upload.id);
          }}
        />
      ))}
    </Fragment>
  );
}

type InProgressUploadThumbnailProps = {
  file: UploadedFile | UploadedFileFromEntry;
};
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

type GridItemLayoutProps = {
  thumbnail: ReactNode;
  name: ReactNode;
  onRemove: () => void;
};
function GridItemLayout({thumbnail, name, onRemove}: GridItemLayoutProps) {
  return (
    <div className="relative flex aspect-square min-h-0 flex-col rounded-panel border px-6 pb-4 pt-6">
      <div className="m-4 flex min-h-0 flex-auto items-center justify-center overflow-hidden">
        {thumbnail}
      </div>
      <div className="mt-6 flex-shrink-0 overflow-hidden overflow-ellipsis whitespace-nowrap text-center text-xs">
        {name}
      </div>
      <IconButton
        className="absolute -right-8 -top-8"
        variant="flat"
        radius="rounded-full"
        color="chip"
        size="2xs"
        onClick={() => onRemove()}
      >
        <CloseIcon />
      </IconButton>
    </div>
  );
}
