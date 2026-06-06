import {CreateArticlePayload} from '@app/help-center/articles/requests/use-create-article';
import {UploadType} from '@app/site-config';
import {FileTypeIcon} from '@common/uploads/components/file-type-icon/file-type-icon';
import {restrictionsFromConfig} from '@common/uploads/uploader/create-file-upload';
import {useFileUploadStore} from '@common/uploads/uploader/file-upload-provider';
import {UploadStrategyConfig} from '@common/uploads/uploader/strategy/upload-strategy';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {CloseIcon} from '@ui/icons/material/Close';
import {ProgressBar} from '@ui/progress/progress-bar';
import {toast} from '@ui/toast/toast';
import {openUploadWindow} from '@ui/utils/files/open-upload-window';
import clsx from 'clsx';
import {useFieldArray} from 'react-hook-form';

export function ArticleAttachmentsEditor() {
  const uploads = useFileUploadStore(s => s.fileUploads);
  const abortUpload = useFileUploadStore(s => s.abortUpload);
  const uploadMultiple = useFileUploadStore(s => s.uploadMultiple);
  const {fields, append, remove} = useFieldArray<CreateArticlePayload>({
    name: 'attachments',
  });

  const handleUpload = async () => {
    const config: UploadStrategyConfig = {
      uploadType: UploadType.articleAttachments,
      onSuccess: entry => {
        append(entry);
      },
      onError: message => {
        if (message) {
          toast.danger(message);
        }
      },
    };
    const restrictions = restrictionsFromConfig(config);
    const files = await openUploadWindow({
      multiple: true,
      types: restrictions?.allowedFileTypes,
    });

    if (files.length) {
      uploadMultiple(files, config);
    }
  };

  return (
    <div>
      <div className="mb-8 mt-34 text-sm">
        <Trans message="Attachments" />
      </div>
      <div>
        {fields.map((field, index) => {
          const attachment =
            field as CreateArticlePayload['attachments'][number];
          return (
            <AttachmentPreview
              key={attachment.id}
              name={attachment.name}
              mime={attachment.mime}
              onRemove={() => remove(index)}
              downloadLink={`file-entries/download/${attachment.hash}`}
            />
          );
        })}
        {[...uploads.entries()]
          .filter(([_, upload]) => upload.status === 'inProgress')
          .map(([id, upload]) => (
            <AttachmentPreview
              key={id}
              name={upload.file.name}
              mime={upload.file.mime}
              progress={upload.percentage}
              onRemove={() => abortUpload(id)}
            />
          ))}
      </div>
      <div className="mt-6">
        <Button variant="link" color="primary" onClick={() => handleUpload()}>
          <Trans message="Upload attachment (max 20MB)" />
        </Button>
      </div>
    </div>
  );
}

interface AttachmentPreviewProps {
  name: string;
  mime: string;
  progress?: number;
  onRemove: () => void;
  downloadLink?: string;
}
function AttachmentPreview({
  name,
  mime,
  progress,
  onRemove,
  downloadLink,
}: AttachmentPreviewProps) {
  return (
    <div className="py-2">
      <div className="flex items-center gap-6 text-sm">
        <FileTypeIcon mime={mime} size="xs" />
        <AttachmentName
          name={name}
          className="overflow-hidden overflow-ellipsis whitespace-nowrap"
          downloadLink={downloadLink}
        />
        <IconButton onClick={() => onRemove()} size="xs">
          <CloseIcon />
        </IconButton>
      </div>
      {progress ? (
        <ProgressBar value={progress} className="mt-4 max-w-224" size="xs" />
      ) : null}
    </div>
  );
}

interface AttachmentNameProps {
  name: string;
  downloadLink?: string;
  className?: string;
}
function AttachmentName({name, downloadLink, className}: AttachmentNameProps) {
  if (downloadLink) {
    return (
      <a
        href={downloadLink}
        download
        className={clsx(className, 'hover:underline')}
      >
        {name}
      </a>
    );
  }
  return <div className={className}>{name}</div>;
}
