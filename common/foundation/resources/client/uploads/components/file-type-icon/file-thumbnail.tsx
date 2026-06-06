import {useTrans} from '@ui/i18n/use-trans';
import clsx from 'clsx';
import {useFileEntryUrls} from '../../file-entry-urls';
import {FileTypeIcon} from './file-type-icon';

const TwoMB = 2 * 1024 * 1024;

interface Props {
  file: {
    name: string;
    type: string;
    thumbnail?: boolean;
    file_size?: number;
    hash: string;
    file_name: string;
    url?: string;
  };
  className?: string;
  iconClassName?: string;
  showImage?: boolean;
}
export function FileThumbnail({
  file,
  className,
  iconClassName,
  showImage = true,
}: Props) {
  const {trans} = useTrans();
  const {previewUrl} = useFileEntryUrls(file, {preferThumbnail: true});

  // don't show images for files larger than 2MB, if thumbnail was not generated to avoid ui lag
  if (file.file_size && file.file_size > TwoMB && !file.thumbnail) {
    showImage = false;
  }

  if (showImage && file.type === 'image' && previewUrl) {
    const alt = trans({
      message: ':fileName thumbnail',
      values: {fileName: file.name},
    });
    return (
      <img
        className={clsx(className, 'object-cover')}
        src={previewUrl}
        alt={alt}
        draggable={false}
      />
    );
  }
  return <FileTypeIcon className={iconClassName} type={file.type} />;
}
