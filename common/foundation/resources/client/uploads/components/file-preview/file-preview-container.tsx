import {FilePreviewEntry} from '@common/uploads/components/file-preview/file-preview-entry';
import {FileThumbnail} from '@common/uploads/components/file-type-icon/file-thumbnail';
import {useControlledState} from '@react-stately/utils';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {ChevronLeftIcon} from '@ui/icons/material/ChevronLeft';
import {ChevronRightIcon} from '@ui/icons/material/ChevronRight';
import {CloseIcon} from '@ui/icons/material/Close';
import {FileDownloadIcon} from '@ui/icons/material/FileDownload';
import {KeyboardArrowLeftIcon} from '@ui/icons/material/KeyboardArrowLeft';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import {downloadFileFromUrl} from '@ui/utils/files/download-file-from-url';
import {useMediaQuery} from '@ui/utils/hooks/use-media-query';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';
import {Fragment, ReactNode, useContext, useMemo} from 'react';
import {useFileEntryUrls} from '../../file-entry-urls';
import {getPreviewForEntry} from './available-previews';
import {FilePreviewContext} from './file-preview-context';

export interface FilePreviewContainerProps {
  entries: FilePreviewEntry[];
  activeIndex?: number;
  defaultActiveIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  onClose?: () => void;
  showHeader?: boolean;
  headerActionsLeft?: ReactNode;
  className?: string;
  allowDownload?: boolean;
}
export function FilePreviewContainer({
  entries,
  onClose,
  showHeader = true,
  className,
  headerActionsLeft,
  allowDownload = true,
  ...props
}: FilePreviewContainerProps) {
  const isMobile = useMediaQuery('(max-width: 1024px)');

  const [activeIndex, setActiveIndex] = useControlledState(
    props.activeIndex,
    props.defaultActiveIndex || 0,
    props.onActiveIndexChange,
  );

  const activeEntry = entries[activeIndex];
  const contextValue = useMemo(() => {
    return {entries, activeIndex};
  }, [entries, activeIndex]);
  const Preview = getPreviewForEntry(activeEntry);

  if (!activeEntry) {
    onClose?.();
    return null;
  }

  const canOpenNext = entries.length - 1 > activeIndex;
  const openNext = () => {
    setActiveIndex(activeIndex + 1);
  };
  const canOpenPrevious = activeIndex > 0;
  const openPrevious = () => {
    setActiveIndex(activeIndex - 1);
  };

  return (
    <FilePreviewContext.Provider value={contextValue}>
      {showHeader && (
        <Header
          actionsLeft={headerActionsLeft}
          isMobile={isMobile}
          onClose={onClose}
          onNext={canOpenNext ? openNext : undefined}
          onPrevious={canOpenPrevious ? openPrevious : undefined}
          allowDownload={allowDownload}
        />
      )}
      <div className={clsx('relative flex-auto overflow-hidden', className)}>
        {isMobile && (
          <IconButton
            size="lg"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 transform text-muted"
            disabled={!canOpenPrevious}
            onClick={openPrevious}
          >
            <KeyboardArrowLeftIcon />
          </IconButton>
        )}
        <AnimatePresence initial={false}>
          <m.div
            className="absolute inset-0 flex items-center justify-center"
            key={activeEntry.id}
            {...opacityAnimation}
          >
            <Preview
              className="max-h-[calc(100%-30px)]"
              entry={activeEntry}
              allowDownload={allowDownload}
            />
          </m.div>
        </AnimatePresence>
        {isMobile && (
          <IconButton
            size="lg"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 transform text-muted"
            disabled={!canOpenNext}
            onClick={openNext}
          >
            <KeyboardArrowRightIcon />
          </IconButton>
        )}
      </div>
    </FilePreviewContext.Provider>
  );
}

interface HeaderProps {
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
  isMobile: boolean | null;
  actionsLeft?: ReactNode;
  allowDownload?: boolean;
}
function Header({
  onNext,
  onPrevious,
  onClose,
  isMobile,
  actionsLeft,
  allowDownload,
}: HeaderProps) {
  const {entries, activeIndex} = useContext(FilePreviewContext);
  const activeEntry = entries[activeIndex];
  const {downloadUrl} = useFileEntryUrls(activeEntry);

  const desktopDownloadButton = (
    <Button
      startIcon={<FileDownloadIcon />}
      variant="text"
      onClick={() => {
        if (downloadUrl) {
          downloadFileFromUrl(downloadUrl);
        }
      }}
    >
      <Trans message="Download" />
    </Button>
  );

  const mobileDownloadButton = (
    <IconButton
      onClick={() => {
        if (downloadUrl) {
          downloadFileFromUrl(downloadUrl);
        }
      }}
    >
      <FileDownloadIcon />
    </IconButton>
  );

  const downloadButton = isMobile
    ? mobileDownloadButton
    : desktopDownloadButton;

  return (
    <div className="flex min-h-50 flex-shrink-0 items-center justify-between gap-20 border-b bg-elevated px-10 text-sm text-muted">
      <div className="flex w-1/3 items-center justify-start gap-4">
        {actionsLeft}
        {allowDownload ? downloadButton : undefined}
      </div>
      <div className="flex w-1/3 flex-nowrap items-center justify-center gap-10 text-main">
        <FileThumbnail
          file={activeEntry}
          iconClassName="w-16 h-16"
          showImage={false}
        />
        <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
          {activeEntry.name}
        </div>
      </div>
      <div className="flex w-1/3 items-center justify-end gap-10 whitespace-nowrap">
        {!isMobile && (
          <Fragment>
            <IconButton disabled={!onPrevious} onClick={onPrevious}>
              <ChevronLeftIcon />
            </IconButton>
            <div>{activeIndex + 1}</div>
            <div>/</div>
            <div>{entries.length}</div>
            <IconButton disabled={!onNext} onClick={onNext}>
              <ChevronRightIcon />
            </IconButton>
            <div className="mx-20 h-24 w-1 bg-divider" />
          </Fragment>
        )}
        <IconButton radius="rounded-none" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
    </div>
  );
}
