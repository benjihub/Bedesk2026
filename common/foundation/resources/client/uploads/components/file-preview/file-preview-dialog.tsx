import {Dialog} from '@ui/overlays/dialog/dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {
  FilePreviewContainer,
  FilePreviewContainerProps,
} from './file-preview-container';

interface Props extends Omit<FilePreviewContainerProps, 'onClose'> {}
export function FilePreviewDialog(props: Props) {
  return (
    <Dialog
      size="fullscreenTakeover"
      background="bg-alt"
      className="flex flex-col"
    >
      <Content {...props} />
    </Dialog>
  );
}

export function Content(props: Props) {
  const {close} = useDialogContext();
  return <FilePreviewContainer onClose={close} {...props} />;
}
