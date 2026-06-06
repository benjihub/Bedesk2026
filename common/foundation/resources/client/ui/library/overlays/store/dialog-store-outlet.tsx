import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {closeDialog, useDialogStore} from '@ui/overlays/store/dialog-store';

export function DialogStoreOutlet() {
  const {dialog: DialogElement, data, options} = useDialogStore();
  return (
    <DialogTrigger
      {...options}
      type="modal"
      isOpen={DialogElement != null}
      onClose={value => {
        closeDialog(value);
      }}
    >
      {DialogElement ? <DialogElement {...data} /> : null}
    </DialogTrigger>
  );
}
