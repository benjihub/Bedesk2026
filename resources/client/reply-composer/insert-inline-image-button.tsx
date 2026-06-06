import {UploadType} from '@app/site-config';
import {ImageButton} from '@common/text-editor/menubar/image-button';

interface Props {
  uploadType: keyof typeof UploadType;
}
export function InsertInlineImageButton({uploadType}: Props) {
  return <ImageButton size="xs" iconSize="sm" uploadType={uploadType} />;
}
