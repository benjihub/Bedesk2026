import {FileUploadProvider} from '@common/uploads/uploader/file-upload-provider';
import {ReactElement, ReactNode} from 'react';

interface Props {
  header: ReactNode;
  feed: ReactElement;
  editor: ReactNode;
  fixedHeader?: ReactNode;
}
export function WidgetChatFeedLayout({
  header,
  feed,
  editor,
  fixedHeader,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {fixedHeader && <div className="mb-20 px-20">{fixedHeader}</div>}
      <div className="compact-scrollbar min-h-0 flex-auto overflow-auto overscroll-contain px-20 stable-scrollbar">
        {header}
        {feed}
      </div>
      <FileUploadProvider>
        <div className="mt-20 px-20 pb-16">{editor}</div>
      </FileUploadProvider>
    </div>
  );
}
