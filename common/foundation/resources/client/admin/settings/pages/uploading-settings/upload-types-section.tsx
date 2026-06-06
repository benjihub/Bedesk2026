import {AdminSettings} from '@common/admin/settings/admin-settings';
import {JsonChipField} from '@common/admin/settings/layout/json-chip-field';
import {SettingsSectionHeader} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {
  UploadingBackendSettings,
  UploadingTypeSettings,
} from '@common/core/settings/base-backend-settings';
import {FormFileSizeField} from '@common/uploads/components/file-size-field';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {SettingsIcon} from '@ui/icons/material/Settings';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Fragment} from 'react';
import {useForm, useFormContext, useWatch} from 'react-hook-form';

export function UploadTypesSection() {
  const {data} = useAdminSettings();
  const form = useFormContext<AdminSettings>();

  const availableBackends =
    useWatch<AdminSettings, 'client.uploading.backends'>({
      name: 'client.uploading.backends',
    }) ?? [];

  return (
    <Fragment>
      <SettingsSectionHeader margin="mt-44 mb-12" size="lg">
        <Trans message="Upload types" />
        <Trans message="Configure storage backends and file restrictions for different upload types across the site." />
      </SettingsSectionHeader>
      <div className="space-y-12">
        {Object.entries(data.uploading.types).map(([type, config]) => (
          <DialogTrigger
            type="modal"
            key={type}
            onClose={value => {
              if (value) {
                form.setValue(`client.uploading.types.${type}`, value, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
            }}
          >
            <div
              role="button"
              tabIndex={0}
              className="flex cursor-pointer items-center rounded-panel border p-16 transition-button hover:bg-hover"
            >
              <div>
                <div className="pb-2 text-sm font-semibold">
                  <Trans message={config.label} />
                </div>
                <div className="text-xs text-muted">
                  <Trans message={config.description} />
                </div>
              </div>
              <SettingsIcon className="ml-auto text-muted" size="sm" />
            </div>
            <UploadTypeDialog
              name={type}
              availableBackends={availableBackends}
            />
          </DialogTrigger>
        ))}
      </div>
    </Fragment>
  );
}

type UploadTypeDialogProps = {
  name: string;
  availableBackends: UploadingBackendSettings[];
};
function UploadTypeDialog({name, availableBackends}: UploadTypeDialogProps) {
  const {formId, close} = useDialogContext();
  const values = useWatch({
    name: `client.uploading.types.${name}`,
  });
  const form = useForm<UploadingTypeSettings>({
    defaultValues: values,
  });
  return (
    <Dialog size="lg">
      <DialogHeader>
        <Trans message="Update upload type" />
      </DialogHeader>
      <DialogBody>
        <Form
          form={form}
          id={formId}
          onSubmit={value => close(value)}
          className="space-y-20"
        >
          <BackendsField availableBackends={availableBackends} />
          <FormTextField
            name={`root`}
            label={<Trans message="Folder" />}
            descriptionPosition="top"
            description={
              <Trans message="Where in the backend should the uploads be stored. Leave empty to use default folder." />
            }
          />
          <MaxUploadSizeField />
          <AllowedFileTypesField />
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button type="submit" variant="flat" color="primary" form={formId}>
          <Trans message="Update" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function BackendsField({
  availableBackends,
}: {
  availableBackends: UploadingBackendSettings[];
}) {
  return (
    <FormChipField
      required
      label={<Trans message="Storage backends" />}
      name={`backends`}
      suggestions={availableBackends}
      valueKey="id"
      displayWith={v => availableBackends?.find(b => b.id === v.id)?.name}
      description={
        <Trans message="Select in which backend(s) these uploads should be stored." />
      }
    >
      {backend => (
        <Item key={backend.id} value={backend.id}>
          {backend.name}
        </Item>
      )}
    </FormChipField>
  );
}

function MaxUploadSizeField() {
  return (
    <FormFileSizeField
      min={1}
      descriptionPosition="top"
      label={<Trans message="Maximum file size" />}
      name={`max_file_size`}
      description={
        <Trans message="Size (in bytes) for a single file user can upload." />
      }
    />
  );
}

export function AllowedFileTypesField() {
  const {trans} = useTrans();
  return (
    <JsonChipField
      name="accept"
      placeholder={trans(message('Select or enter a type...'))}
      label={<Trans message="Allowed file types" />}
      descriptionPosition="top"
      allowCustomValue
      description={
        <Trans message="Extension, mime type or file type. Leave empty to use defaults." />
      }
    >
      <Item value="image">
        <Trans message="Image" />
      </Item>
      <Item value="video">
        <Trans message="Video" />
      </Item>
      <Item value="audio">
        <Trans message="Audio" />
      </Item>
      <Item value=".png">
        <Trans message="PNG" />
      </Item>
      <Item value=".jpeg">
        <Trans message="JPG" />
      </Item>
      <Item value=".gif">
        <Trans message="GIF" />
      </Item>
      <Item value=".mp3">
        <Trans message="MP3" />
      </Item>
      <Item value=".mp4">
        <Trans message="MP4" />
      </Item>
    </JsonChipField>
  );
}
