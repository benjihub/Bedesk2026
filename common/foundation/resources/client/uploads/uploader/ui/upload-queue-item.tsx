import {FileTypeIcon} from '@common/uploads/components/file-type-icon/file-type-icon';
import {useFileUploadStore} from '@common/uploads/uploader/file-upload-provider';
import {IconButton} from '@ui/buttons/icon-button';
import {message} from '@ui/i18n/message';
import {MixedText} from '@ui/i18n/mixed-text';
import {Trans} from '@ui/i18n/trans';
import {CheckCircleIcon} from '@ui/icons/material/CheckCircle';
import {CloseIcon} from '@ui/icons/material/Close';
import {ErrorIcon} from '@ui/icons/material/Error';
import {WarningIcon} from '@ui/icons/material/Warning';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {Tooltip} from '@ui/tooltip/tooltip';
import {prettyBytes} from '@ui/utils/files/pretty-bytes';
import {
  UploadedFile,
  UploadedFileFromEntry,
} from '@ui/utils/files/uploaded-file';
import {shallowEqual} from '@ui/utils/shallow-equal';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';
import {
  ComponentPropsWithoutRef,
  CSSProperties,
  Fragment,
  memo,
  ReactElement,
  useMemo,
  useState,
} from 'react';
import {useShallow} from 'zustand/react/shallow';

interface Props {
  file: UploadedFile | UploadedFileFromEntry;
  className?: string;
  style?: CSSProperties;
}
export const UploadQueueItem = memo(({file, className, style}: Props) => {
  return (
    <div className={clsx('flex items-center gap-14', className)} style={style}>
      <div className="shrink-0 rounded border p-8">
        <FileTypeIcon className="h-22 w-22" mime={file.mime} />
      </div>
      <div className="min-w-0 flex-auto pr-10">
        <div className="mb-2 flex min-w-0 items-center gap-10">
          <div className="min-w-0 flex-auto overflow-hidden overflow-ellipsis whitespace-nowrap font-medium">
            {file.name}
          </div>
        </div>
        <SizeInfo file={file} />
      </div>
      <div className="mr-10">
        <FileStatus file={file} />
      </div>
    </div>
  );
}, shallowEqual);

interface SizeInfoProps {
  file: UploadedFile | UploadedFileFromEntry;
}
function SizeInfo({file}: SizeInfoProps) {
  const fileUpload = useFileUploadStore(
    useShallow(s => s.fileUploads.get(file.id)),
  );
  const bytesUploaded = fileUpload?.bytesUploaded || 0;

  const totalBytes = useMemo(() => prettyBytes(file.size), [file]);
  const uploadedBytes = useMemo(
    () => prettyBytes(bytesUploaded),
    [bytesUploaded],
  );

  let statusMessage: ReactElement;
  if (fileUpload?.status === 'completed') {
    statusMessage = <Trans message="Upload complete" />;
  } else if (fileUpload?.status === 'aborted') {
    statusMessage = <Trans message="Upload cancelled" />;
  } else if (fileUpload?.status === 'failed') {
    statusMessage = <Trans message="Upload failed" />;
  } else if (fileUpload?.status === 'pending') {
    statusMessage = <Fragment>{totalBytes}</Fragment>;
  } else {
    statusMessage = (
      <Trans
        message=":bytesUploaded of :totalBytes"
        values={{
          bytesUploaded: uploadedBytes,
          totalBytes,
        }}
      />
    );
  }

  return <div className="text-xs text-muted">{statusMessage}</div>;
}

interface FileStatusProps {
  file: UploadedFile | UploadedFileFromEntry;
}
function FileStatus({file}: FileStatusProps) {
  const fileUpload = useFileUploadStore(
    useShallow(s => s.fileUploads.get(file.id)),
  );
  const abortUpload = useFileUploadStore(s => s.abortUpload);
  const percentage = fileUpload?.percentage || 0;
  const status = fileUpload?.status;
  const errorMessage = fileUpload?.errorMessage;

  const [isHovered, setIsHovered] = useState(false);

  const abortButton = (
    <IconButton
      size="xs"
      iconSize="sm"
      onClick={() => {
        abortUpload(file.id);
      }}
    >
      <CloseIcon />
    </IconButton>
  );

  const progressButton = (
    <ProgressCircle
      aria-label="Upload progress"
      size="w-24 h-24"
      value={percentage}
      isIndeterminate={percentage === 100}
      trackWidth={3}
    />
  );

  let statusButton: ReactElement;
  if (status === 'failed') {
    const errMessage =
      errorMessage || message('This file could not be uploaded');
    statusButton = (
      <AnimatedStatus>
        <Tooltip variant="danger" label={<MixedText value={errMessage} />}>
          <ErrorIcon className="text-danger" size="md" />
        </Tooltip>
      </AnimatedStatus>
    );
  } else if (status === 'aborted') {
    statusButton = (
      <AnimatedStatus>
        <WarningIcon className="text-warning" size="md" />
      </AnimatedStatus>
    );
  } else if (status === 'completed') {
    statusButton = (
      <AnimatedStatus>
        <CheckCircleIcon size="md" className="text-positive" />
      </AnimatedStatus>
    );
  } else if (status === 'pending') {
    statusButton = <AnimatedStatus>{abortButton}</AnimatedStatus>;
  } else {
    statusButton = (
      <AnimatedStatus
        onPointerEnter={e => {
          if (e.pointerType === 'mouse') {
            setIsHovered(true);
          }
        }}
        onPointerLeave={e => {
          if (e.pointerType === 'mouse') {
            setIsHovered(false);
          }
        }}
      >
        {isHovered ? abortButton : progressButton}
      </AnimatedStatus>
    );
  }

  return <AnimatePresence>{statusButton}</AnimatePresence>;
}

interface AnimatedStatusProps
  extends Omit<
    ComponentPropsWithoutRef<'div'>,
    'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'
  > {
  children: ReactElement;
}
function AnimatedStatus({children, ...domProps}: AnimatedStatusProps) {
  return (
    <m.div
      {...domProps}
      initial={{scale: 0, opacity: 0}}
      animate={{scale: 1, opacity: 1}}
      exit={{scale: 0, opacity: 0}}
    >
      {children}
    </m.div>
  );
}
