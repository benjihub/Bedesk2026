import {UploadType} from '@app/site-config';
import {AlignButtons} from '@common/text-editor/menubar/align-buttons';
import {ClearFormatButton} from '@common/text-editor/menubar/clear-format-button';
import {CodeBlockMenuTrigger} from '@common/text-editor/menubar/code-block-menu-trigger';
import {ColorButtons} from '@common/text-editor/menubar/color-buttons';
import {Divider} from '@common/text-editor/menubar/divider';
import {FontStyleButtons} from '@common/text-editor/menubar/font-style-buttons';
import {FormatMenuTrigger} from '@common/text-editor/menubar/format-menu-trigger';
import {ImageButton} from '@common/text-editor/menubar/image-button';
import {IndentButtons} from '@common/text-editor/menubar/indent-buttons';
import {InsertMenuTrigger} from '@common/text-editor/menubar/insert-menu-trigger';
import {LinkButton} from '@common/text-editor/menubar/link-button';
import {ListButtons} from '@common/text-editor/menubar/list-buttons';
import {ButtonSize} from '@ui/buttons/button-size';
import clsx from 'clsx';

interface Props {
  justify?: string;
  hideInsertButton?: boolean;
  imageUploadType: keyof typeof UploadType;
  size?: ButtonSize;
}
export function ArticleEditorMenubar({
  size = 'sm',
  justify = 'justify-center-safe',
  hideInsertButton = false,
  imageUploadType,
}: Props) {
  return (
    <div
      className={clsx(
        'hidden-scrollbar flex flex-shrink-0 items-center overflow-x-auto border-b px-4 py-2 text-muted',
        justify,
      )}
    >
      <FormatMenuTrigger size={size} />
      <Divider />
      <FontStyleButtons size={size} />
      <Divider />
      <AlignButtons size={size} />
      <IndentButtons size={size} />
      <Divider />
      <ListButtons size={size} />
      <Divider />
      <LinkButton size={size} />
      <ImageButton size={size} uploadType={imageUploadType} />
      {!hideInsertButton && <InsertMenuTrigger size={size} />}
      <Divider />
      <ColorButtons size={size} />
      <Divider />
      <CodeBlockMenuTrigger size={size} />
      <ClearFormatButton size={size} />
    </div>
  );
}
