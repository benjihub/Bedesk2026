import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {downloadFileFromUrl} from '@ui/utils/files/download-file-from-url';
import clsx from 'clsx';
import {ReactNode, useContext} from 'react';
import {useFileEntryUrls} from '../../../file-entry-urls';
import {FilePreviewContext} from '../file-preview-context';
import {FilePreviewProps} from './file-preview-props';

interface Props extends FilePreviewProps {
  message?: ReactNode;
}
export function DefaultFilePreview({message, className, allowDownload}: Props) {
  const {entries, activeIndex} = useContext(FilePreviewContext);
  const activeEntry = entries[activeIndex];
  const content = message || <Trans message="No file preview available" />;
  const {downloadUrl} = useFileEntryUrls(activeEntry);
  return (
    <div
      className={clsx(
        className,
        'w-[calc(100%-40px)] max-w-400 rounded-panel bg-elevated p-40 text-center shadow',
      )}
    >
      <div className="text-lg">{content}</div>
      {allowDownload && (
        <div className="mt-20 block text-center">
          <Button
            variant="flat"
            color="primary"
            onClick={() => {
              if (downloadUrl) {
                downloadFileFromUrl(downloadUrl);
              }
            }}
          >
            <Trans message="Download" />
          </Button>
        </div>
      )}
    </div>
  );
}
