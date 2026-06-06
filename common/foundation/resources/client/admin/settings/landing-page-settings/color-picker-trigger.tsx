import {SettingsSectionButton} from '@common/admin/settings/layout/settings-section-button';
import {ColorIcon} from '@common/admin/settings/pages/themes-settings/color-icon';
import {ColorPickerDialog} from '@ui/color-picker/color-picker-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {ReactNode} from 'react';
import {useFormContext} from 'react-hook-form';

interface ColorPickerTriggerProps {
  formKey: string;
  label: ReactNode;
}
export function ColorPickerTrigger({label, formKey}: ColorPickerTriggerProps) {
  const {watch, setValue} = useFormContext();

  const formValue = watch(formKey);

  const setColor = (value: string | null) => {
    setValue(formKey as any, value, {
      shouldDirty: true,
    });
  };

  return (
    <DialogTrigger
      type="popover"
      value={formValue}
      alwaysReturnCurrentValueOnClose
      onValueChange={newValue => setColor(newValue)}
      onClose={value => setColor(value)}
      placement="right"
    >
      <SettingsSectionButton
        className="capitalize"
        startIcon={
          <ColorIcon
            viewBox="0 0 48 48"
            className="icon-lg"
            style={{fill: formValue}}
          />
        }
      >
        {label}
      </SettingsSectionButton>
      <ColorPickerDialog />
    </DialogTrigger>
  );
}
