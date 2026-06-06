import {UploadType} from '@app/site-config';
import {ButtonSize} from '@ui/buttons/button-size';
import {IconButton} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {ImageUpIcon} from '@ui/icons/lucide/image-up';
import {Tooltip} from '@ui/tooltip/tooltip';
import {getImageSize} from '@ui/utils/files/get-image-size';
import clsx from 'clsx';
import {useActiveUpload} from '../../uploads/uploader/use-active-upload';
import {useCurrentTextEditor} from '../tiptap-editor-context';

type Props = {
  uploadType: keyof typeof UploadType;
  size?: ButtonSize;
  iconSize?: ButtonSize;
};
export function ImageButton({size, iconSize, uploadType}: Props) {
  const editor = useCurrentTextEditor();
  const {selectAndUploadFile} = useActiveUpload();

  const handleUpload = () => {
    selectAndUploadFile({
      uploadType,
      showToastOnRestrictionFail: true,
      onSuccess: async (entry, file) => {
        if (!editor) return;
        const size = await getImageSize(file.native);
        editor.commands.focus();
        editor.commands.setImage({
          src: entry.url,
          width: size.width,
          height: size.height,
        });
      },
    });
  };

  return (
    <Tooltip label={<Trans message="Insert image" />}>
      <IconButton
        size={size}
        iconSize={iconSize}
        onClick={handleUpload}
        className={clsx('flex-shrink-0')}
        disabled={!editor}
      >
        <ImageUpIcon />
      </IconButton>
    </Tooltip>
  );
}
