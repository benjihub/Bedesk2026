import {AdminSettings} from '@common/admin/settings/admin-settings';
import {useSettingsPageStore} from '@common/admin/settings/layout/settings-page-store';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Form} from '@ui/forms/form';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item as MenuItem} from '@ui/forms/listbox/item';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {MoreVertIcon} from '@ui/icons/material/MoreVert';
import {RestartAltIcon} from '@ui/icons/material/RestartAlt';
import {TuneIcon} from '@ui/icons/material/Tune';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {CssTheme} from '@ui/themes/css-theme';
import {toast} from '@ui/toast/toast';
import {Fragment, useEffect, useState} from 'react';
import {useForm, useFormContext} from 'react-hook-form';

interface Props {
  selectedThemeId: number;
  initialThemeId: number;
  onSelectedThemeChange: (index: number) => void;
}
export function ThemeOptionsButton({
  selectedThemeId,
  initialThemeId,
  onSelectedThemeChange,
}: Props) {
  const preview = useSettingsPageStore(s => s.preview);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const {setValue, getValues} = useFormContext<AdminSettings>();
  const {
    data: {defaults},
  } = useAdminSettings();

  const deleteTheme = () => {
    if (getValues('themes').length <= 1) {
      toast.danger(message('At least one theme is required'));
      return;
    }
    if (selectedThemeId) {
      setValue(
        'themes',
        getValues('themes').filter(t => t.id !== selectedThemeId),
        {shouldDirty: true},
      );

      const initialTheme = getValues('themes').find(
        t => t.id === initialThemeId,
      );

      if (initialThemeId === selectedThemeId) {
        window.location.reload();
      } else {
        if (initialTheme) {
          onSelectedThemeChange(initialThemeId);
        } else {
          onSelectedThemeChange(getValues('themes')[0].id);
        }
      }
    }
  };

  const resetThemeColors = () => {
    const selectedThemeIndex = getValues('themes').findIndex(
      t => t.id === selectedThemeId,
    );
    const path = `themes.${selectedThemeIndex}` as 'themes.0';
    const defaultColors = getValues(`${path}.is_dark`)
      ? defaults.themes.dark
      : defaults.themes.light;

    Object.entries(defaultColors).forEach(([colorName, themeValue]) => {
      preview.setThemeValue(colorName, themeValue);
    });
    preview.setThemeFont(null);

    setValue(`${path}.values`, defaultColors, {
      shouldDirty: true,
    });
    setValue(`${path}.font`, undefined, {
      shouldDirty: true,
    });
  };

  return (
    <Fragment>
      <MenuTrigger>
        <IconButton variant="outline" size="sm">
          <MoreVertIcon />
        </IconButton>
        <Menu>
          <MenuItem
            value="settings"
            startIcon={<TuneIcon />}
            onSelected={() => setSettingsDialogOpen(true)}
          >
            <Trans message="Settings" />
          </MenuItem>
          <MenuItem
            value="reset"
            startIcon={<RestartAltIcon />}
            onSelected={() => resetThemeColors()}
          >
            <Trans message="Reset to default" />
          </MenuItem>
          <MenuItem
            value="delete"
            startIcon={<DeleteIcon />}
            onSelected={() => setConfirmDialogOpen(true)}
          >
            <Trans message="Delete" />
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <DialogTrigger
        type="modal"
        isOpen={confirmDialogOpen}
        onClose={isConfirmed => {
          if (isConfirmed) {
            deleteTheme();
          }
          setConfirmDialogOpen(false);
        }}
      >
        <ConfirmationDialog
          isDanger
          title={<Trans message="Delete theme" />}
          body={<Trans message="Are you sure you want to delete this theme?" />}
          confirm={<Trans message="Delete" />}
        />
      </DialogTrigger>
      <DialogTrigger
        type="modal"
        isOpen={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
      >
        <SettingsDialog
          theme={getValues(`themes`).find(t => t.id === selectedThemeId)}
        />
      </DialogTrigger>
    </Fragment>
  );
}

interface SettingsDialogProps {
  theme?: CssTheme;
}
function SettingsDialog({theme}: SettingsDialogProps) {
  const settingsForm = useFormContext<AdminSettings>();
  const form = useForm<CssTheme>({defaultValues: theme});
  const {close, formId} = useDialogContext();

  useEffect(() => {
    const subscription = form.watch((value, {name}) => {
      // theme can only be set as either light or dark default
      if (name === 'default_light' && value.default_light) {
        form.setValue('default_dark', false);
      }
      if (name === 'default_dark' && value.default_dark) {
        form.setValue('default_light', false);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const applyChanges = (value: CssTheme) => {
    settingsForm.getValues('themes').forEach((currentTheme, index) => {
      // update changed theme
      if (currentTheme.id === value.id) {
        settingsForm.setValue(`themes.${index}`, value, {
          shouldDirty: true,
        });
        return;
      }

      // unset "default_light" and "default_dark" on other themes
      if (value.default_light) {
        settingsForm.setValue(
          `themes.${index}`,
          {...currentTheme, default_light: false},
          {shouldDirty: true},
        );
        return;
      }
      if (value.default_dark) {
        settingsForm.setValue(
          `themes.${index}`,
          {...currentTheme, default_dark: false},
          {shouldDirty: true},
        );
        return;
      }
    });
  };

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Update settings" />
      </DialogHeader>
      <DialogBody>
        <Form
          form={form}
          id={formId}
          onSubmit={values => {
            applyChanges(values);
            close();
          }}
        >
          <ThemeSettingsFormFields />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button
          onClick={() => {
            close();
          }}
        >
          <Trans message="Cancel" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          type="submit"
          form={formId}
          disabled={!form.formState.isDirty}
        >
          <Trans message="Save" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export function ThemeSettingsFormFields() {
  return (
    <Fragment>
      <FormTextField
        name="name"
        label={<Trans message="Name" />}
        className="mb-24"
        autoFocus
        required
      />
      <FormSwitch
        name="is_dark"
        className="mb-20 border-b pb-20"
        description={
          <Trans message="Whether this theme has light text on dark background." />
        }
      >
        <Trans message="Dark theme" />
      </FormSwitch>
      <FormSwitch
        name="default_light"
        className="mb-24"
        description={
          <Trans message="When light mode is selected, this theme will be used." />
        }
      >
        <Trans message="Default for light mode" />
      </FormSwitch>
      <FormSwitch
        name="default_dark"
        description={
          <Trans message="When dark mode is selected, this theme will be used." />
        }
      >
        <Trans message="Default for dark mode" />
      </FormSwitch>
    </Fragment>
  );
}
