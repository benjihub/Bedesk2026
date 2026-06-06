import {FilePreviewEntry} from '@common/uploads/components/file-preview/file-preview-entry';
import React from 'react';

export interface FilePreviewContextValue {
  entries: FilePreviewEntry[];
  activeIndex: number;
}

export const FilePreviewContext = React.createContext<FilePreviewContextValue>(
  null!,
);
