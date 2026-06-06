import {AdminSettings} from '@common/admin/settings/admin-settings';
import {ThemeSettingsFormFields} from '@common/admin/settings/pages/themes-settings/theme-options-button';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Form} from '@ui/forms/form';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {CssTheme} from '@ui/themes/css-theme';
import {randomNumber} from '@ui/utils/string/random-number';
import {useForm, useFormContext} from 'react-hook-form';

interface Props {
  type?: string;
  onCreated?: (index: number) => void;
}
export function CreateNewThemeButton({type = 'site', onCreated}: Props) {
  return (
    <DialogTrigger
      type="modal"
      onClose={newThemeId => {
        if (newThemeId != null) {
          onCreated?.(newThemeId);
        }
      }}
    >
      <IconButton
        variant="outline"
        shadow="shadow"
        size="sm"
        className="ml-auto"
      >
        <AddIcon />
      </IconButton>
      <NewThemDialog type={type} />
    </DialogTrigger>
  );
}

interface NewThemeDialogProps {
  type: string;
}
function NewThemDialog({type}: NewThemeDialogProps) {
  const {formId, close} = useDialogContext();
  const {
    data: {defaults},
  } = useAdminSettings();
  const settingsForm = useFormContext<AdminSettings>();
  const form = useForm<CssTheme>({
    defaultValues: {
      default_dark: false,
      default_light: false,
      is_dark: false,
    },
  });

  const createTheme = (formValues: CssTheme) => {
    const themeColors = formValues.is_dark
      ? defaults.themes.dark
      : defaults.themes.light;
    const currentThemes = settingsForm.getValues('themes');
    const newThemeId = randomNumber(100, 1000);

    settingsForm.setValue(
      'themes',
      [
        ...currentThemes,
        {
          ...formValues,
          id: newThemeId,
          type,
          values: themeColors,
        },
      ],
      {shouldDirty: true},
    );

    close(newThemeId);
  };

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="New theme" />
      </DialogHeader>
      <DialogBody>
        <Form id={formId} form={form} onSubmit={createTheme}>
          <ThemeSettingsFormFields />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
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
