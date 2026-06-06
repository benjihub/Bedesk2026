import React from 'react';
import IconPicker from './icon-picker';
import {Trans} from '@ui/i18n/trans';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';

export function IconPickerDialog() {
  return (
    <Dialog size="w-850" className="min-h-dialog">
      <DialogHeader>
        <Trans message="Select icon" />
      </DialogHeader>
      <DialogBody>
        <IconPickerWrapper />
      </DialogBody>
    </Dialog>
  );
}

function IconPickerWrapper() {
  const {close} = useDialogContext();
  return (
    <IconPicker
      onIconSelected={value => {
        close(value);
      }}
    />
  );
}
