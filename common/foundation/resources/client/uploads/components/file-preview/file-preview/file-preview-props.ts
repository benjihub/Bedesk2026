import {FilePreviewEntry} from '@common/uploads/components/file-preview/file-preview-entry';

export interface FilePreviewProps {
  entry: FilePreviewEntry;
  className?: string;
  allowDownload?: boolean;
}
