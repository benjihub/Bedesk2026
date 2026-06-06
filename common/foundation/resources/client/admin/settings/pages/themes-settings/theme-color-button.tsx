import {AdminSettings} from '@common/admin/settings/admin-settings';
import {useSettingsPageStore} from '@common/admin/settings/layout/settings-page-store';
import {SettingsSectionButton} from '@common/admin/settings/layout/settings-section-button';
import {ColorIcon} from '@common/admin/settings/pages/themes-settings/color-icon';
import {ColorPickerDialog} from '@ui/color-picker/color-picker-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {colorToThemeValue} from '@ui/themes/utils/color-to-theme-value';
import {themeValueToHex} from '@ui/themes/utils/theme-value-to-hex';
import {ReactNode, useEffect, useState} from 'react';
import {useFormContext} from 'react-hook-form';

interface Props {
  label: ReactNode;
  colorName: string;
  initialThemeValue: string;
  themeId: number;
  size?: 'md' | 'lg';
}
export function ThemeColorButton({
  label,
  colorName,
  initialThemeValue,
  themeId,
  size = 'lg',
}: Props) {
  const preview = useSettingsPageStore(s => s.preview);
  const {setValue, getValues} = useFormContext<AdminSettings>();
  const [selectedThemeValue, setSelectedThemeValue] =
    useState<string>(initialThemeValue);

  // set color as css variable in preview and on button preview, but not in appearance values
  // this way color change can be canceled when color picker is closed and applied explicitly via apply button
  const selectThemeValue = (themeValue: string) => {
    setSelectedThemeValue(themeValue);
    preview.setThemeValue(colorName, themeValue);
  };

  useEffect(() => {
    // need to update the color here so changes via "reset colors" button are reflected
    setSelectedThemeValue(initialThemeValue);
  }, [initialThemeValue]);

  return (
    <DialogTrigger
      value={themeValueToHex(selectedThemeValue)}
      type="popover"
      placement="right"
      offset={10}
      onValueChange={newColor => {
        selectThemeValue(colorToThemeValue(newColor));
      }}
      onClose={(newColor, {valueChanged, initialValue}) => {
        if (newColor && valueChanged) {
          const themeIndex = getValues('themes').findIndex(
            t => t.id === themeId,
          );
          setValue(
            `themes.${themeIndex}.values.${colorName}`,
            colorToThemeValue(newColor),
            {shouldDirty: true},
          );
        } else {
          // reset to initial value, if apply button was not clicked
          selectThemeValue(initialValue ? colorToThemeValue(initialValue) : '');
        }
      }}
    >
      <SettingsSectionButton
        size={size}
        radius="rounded-panel"
        startIcon={
          <ColorIcon
            viewBox="0 0 48 48"
            className="icon-lg"
            style={{
              fill: selectedThemeValue.startsWith('#')
                ? selectedThemeValue
                : `rgb(${selectedThemeValue})`,
            }}
          />
        }
      >
        {label}
      </SettingsSectionButton>
      <ColorPickerDialog />
    </DialogTrigger>
  );
}
