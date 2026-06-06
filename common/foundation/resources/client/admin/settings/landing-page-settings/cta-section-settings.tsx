import {MenuItemForm} from '@common/admin/menus/menu-item-form';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsSectionButton} from '@common/admin/settings/layout/settings-section-button';
import {Button} from '@ui/buttons/button';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {ArrowRightIcon} from '@ui/icons/material/ArrowRight';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {ReactElement} from 'react';
import {useFieldArray, useWatch} from 'react-hook-form';
import {Fragment} from 'react/jsx-runtime';

type Props = {
  index: number;
};
export function CtaSectionSettings({index}: Props) {
  const prefix =
    `client.landingPage.sections.${index}` as `client.landingPage.sections.${number}`;
  const buttons = useFieldArray<AdminSettings>({
    name: `${prefix}.buttons`,
  });
  return (
    <Fragment>
      <FormTextField
        label={<Trans message="Title" />}
        className="mb-20"
        name={`${prefix}.title`}
      />
      <FormTextField
        label={<Trans message="Description" />}
        className="mb-20"
        inputElementType="textarea"
        rows={4}
        name={`${prefix}.description`}
      />
      <Divider />
      <div>
        <div className="mb-10 text-sm font-semibold">
          <Trans message="Buttons" />
        </div>
        {buttons.fields.map((button, index) => (
          <Fragment key={button.id}>
            <DialogTrigger type="drawer">
              <SettingsSectionButton
                className="mb-10"
                endIcon={<ArrowRightIcon className="text-muted" />}
              >
                <ButtonName
                  index={index}
                  formPathPrefix={`${prefix}.buttons`}
                />
              </SettingsSectionButton>
              <EditButtonDialog
                formPathPrefix={`${prefix}.buttons.${index}`}
                title={
                  <Trans
                    message="Button :number"
                    values={{number: index + 1}}
                  />
                }
              />
            </DialogTrigger>
          </Fragment>
        ))}
        <Button
          variant="outline"
          color="primary"
          size="xs"
          startIcon={<AddIcon />}
          onClick={() => {
            buttons.append({
              color: 'primary',
              variant: 'flat',
            });
          }}
        >
          <Trans message="Add button" />
        </Button>
      </div>
      <Divider />
      <FormSwitch name={`${prefix}.forceDarkMode`}>
        <Trans message="Always use dark mode" />
      </FormSwitch>
    </Fragment>
  );
}

type ButtonNameProps = {
  index: number;
  formPathPrefix: string;
};
function ButtonName({index, formPathPrefix}: ButtonNameProps) {
  const title = useWatch({
    name: `${formPathPrefix}.${index}.label`,
  });
  return (
    title || <Trans message="Button :number" values={{number: index + 1}} />
  );
}

function Divider() {
  return <div className="my-20 h-1 bg-divider" />;
}

interface EditButtonDialogProps {
  formPathPrefix: string;
  title: ReactElement;
}
function EditButtonDialog({formPathPrefix, title}: EditButtonDialogProps) {
  const {close} = useDialogContext();
  return (
    <Dialog>
      <DialogHeader
        rightAdornment={
          <Button variant="outline" size="xs" onClick={close}>
            <Trans message="Save & close" />
          </Button>
        }
      >
        {title}
      </DialogHeader>
      <DialogBody>
        <MenuItemForm formPathPrefix={formPathPrefix}>
          <FormSelect
            label={<Trans message="Button variant" />}
            name={`${formPathPrefix}.variant`}
            selectionMode="single"
            className="mb-20"
          >
            <Item value="flat">
              <Trans message="Flat" />
            </Item>
            <Item value="outline">
              <Trans message="Outline" />
            </Item>
            <Item value="text">
              <Trans message="Text" />
            </Item>
            <Item value="raised">
              <Trans message="Raised" />
            </Item>
          </FormSelect>
          <FormSelect
            label={<Trans message="Button color" />}
            name={`${formPathPrefix}.color`}
            selectionMode="single"
            className="mb-20"
          >
            <Item value="primary">
              <Trans message="Primary" />
            </Item>
            <Item value="danger">
              <Trans message="Danger" />
            </Item>
            <Item value="positive">
              <Trans message="Positive" />
            </Item>
            <Item value="chip">
              <Trans message="Chip" />
            </Item>
            <Item value="white">
              <Trans message="White" />
            </Item>
            <Item value="default">
              <Trans message="Default" />
            </Item>
          </FormSelect>
        </MenuItemForm>
      </DialogBody>
    </Dialog>
  );
}
