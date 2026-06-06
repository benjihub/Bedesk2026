import {AttributesManager} from '@app/attributes/rendering/attributes-manager';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useSettingsPageStore} from '@common/admin/settings/layout/settings-page-store';
import {chatSettingsRoutes} from '@livechat/admin/settings/use-chat-settings-nav';
import {Button} from '@ui/buttons/button';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {ArrowDropDownIcon} from '@ui/icons/material/ArrowDropDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {useState} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';

export const stableAttributeIds: number[] = [];

export const attributeQueryOptions = helpdeskQueries.attributes.normalizedList({
  for: 'agent',
});

const availableForms = [
  {
    key: 'client.chatWidget.forms.preChat',
    label: message('Pre-chat form'),
  },
  {
    key: 'client.chatWidget.forms.postChat',
    label: message('Post-chat form'),
  },
];

export function FormsSettings() {
  const setPreviewRoute = useSettingsPageStore(s => s.setPreviewRoute);
  const [selectedKey, setSelectedForm] = useState<string>(
    availableForms[0].key,
  );
  const selectedForm =
    availableForms.find(form => form.key === selectedKey) ?? availableForms[0];

  return (
    <div>
      <MenuTrigger
        selectionMode="single"
        selectedValue={selectedKey}
        onSelectionChange={newKey => {
          if ((newKey as string).endsWith('preChat')) {
            setPreviewRoute(chatSettingsRoutes.preChatForm.route);
          } else {
            setPreviewRoute(chatSettingsRoutes.postChatForm.route);
          }
          setSelectedForm(newKey as string);
        }}
      >
        <Button
          variant="outline"
          endIcon={<ArrowDropDownIcon />}
          className="mb-24"
        >
          <Trans {...selectedForm.label} />
        </Button>
        <Menu>
          {availableForms.map(form => (
            <Item key={form.key} value={form.key}>
              <Trans {...form.label} />
            </Item>
          ))}
        </Menu>
      </MenuTrigger>
      <FormEditor key={selectedForm.key} formKey={selectedForm.key} />
    </div>
  );
}
interface Props {
  formKey: string;
}
function FormEditor({formKey}: Props) {
  const {setValue} = useFormContext();
  const selectedAttributeIds: number[] =
    useWatch({
      name: `${formKey}.attributes`,
    }) || stableAttributeIds;

  const setAttributeIds = (newIds: number[]) => {
    setValue(`${formKey}.attributes`, newIds, {shouldDirty: true});
  };

  return (
    <div>
      <FormTextField
        name={`${formKey}.information`}
        label={<Trans message="Information" />}
        inputElementType="textarea"
        rows={2}
        className="mb-12"
      />
      <div className="mb-4 text-sm">
        <Trans message="Attributes" />
      </div>
      <AttributesManager
        queryOptions={attributeQueryOptions}
        selectedAttributeIds={selectedAttributeIds}
        onChange={setAttributeIds}
      />
      <div className="mt-24 border-t pt-24">
        <FormSwitch
          name={`${formKey}.disabled`}
          description={
            <Trans message="Form will not be visible to customers when disabled." />
          }
        >
          <Trans message="Disabled" />
        </FormSwitch>
      </div>
    </div>
  );
}
