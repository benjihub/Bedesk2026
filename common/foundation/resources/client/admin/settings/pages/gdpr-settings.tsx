import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {SettingsSectionHeader} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {Accordion, AccordionItem} from '@ui/accordion/accordion';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {CloseIcon} from '@ui/icons/material/Close';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Fragment} from 'react';
import {useFieldArray, useForm, useFormContext} from 'react-hook-form';
import {MenuItemForm} from '../../menus/menu-item-form';
import {AdminSettings} from '../admin-settings';
import {AddMenuItemDialog} from './menu-settings/add-menu-item-dialog';

export function Component() {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      client: {
        cookie_notice: {
          enable: data.client.cookie_notice?.enable ?? false,
          button: data.client.cookie_notice?.button ?? {},
          position: data.client.cookie_notice?.position ?? 'bottom',
        },
        registration: {
          policies: data.client.registration?.policies ?? [],
        },
      },
    },
  });

  return (
    <AdminSettingsLayout
      form={form}
      title={<Trans message="GDPR" />}
      docsLink={AdminDocsUrls.settings.gdpr}
    >
      <CookieNoticeSection />
      <RegistrationPoliciesSection />
    </AdminSettingsLayout>
  );
}

function CookieNoticeSection() {
  const {watch} = useFormContext<AdminSettings>();
  const noticeEnabled = watch('client.cookie_notice.enable');

  return (
    <div className="mb-44">
      <SettingsSectionHeader margin="mb-24" size="md">
        <Trans message="Cookie Notice" />
        <Trans message="Configure the cookie consent notice shown to visitors from the European Union." />
      </SettingsSectionHeader>
      <FormSwitch name="client.cookie_notice.enable">
        <Trans message="Enable cookie notice" />
      </FormSwitch>
      {noticeEnabled && (
        <div className="mt-20 rounded-panel border p-20">
          <div className="mb-20 border-b pb-6">
            <div className="mb-20 border-b pb-10 text-sm font-medium">
              <Trans message="Information button" />
            </div>
            <div className="mb-20">
              <MenuItemForm
                hideRoleAndPermissionFields
                formPathPrefix="client.cookie_notice.button"
              />
            </div>
          </div>
          <FormSelect
            name="client.cookie_notice.position"
            selectionMode="single"
            label={<Trans message="Cookie notice position" />}
          >
            <Item value="top">
              <Trans message="Top" />
            </Item>
            <Item value="bottom">
              <Trans message="Bottom" />
            </Item>
          </FormSelect>
        </div>
      )}
    </div>
  );
}

function RegistrationPoliciesSection() {
  const {fields, append, remove} = useFieldArray<
    AdminSettings,
    'client.registration.policies'
  >({
    name: 'client.registration.policies',
  });

  return (
    <Fragment>
      <SettingsSectionHeader margin="my-24" size="md">
        <Trans message="Registration Policies" />
        <Trans message="Create policies that will be shown on the registration page. Users will be required to accept them by toggling a checkbox." />
      </SettingsSectionHeader>
      <Accordion variant="outline">
        {fields.map((field, index) => (
          <AccordionItem
            key={field.id}
            label={field.label}
            chevronPosition="left"
            endAppend={
              <IconButton
                variant="text"
                color="danger"
                size="sm"
                onClick={() => remove(index)}
              >
                <CloseIcon />
              </IconButton>
            }
          >
            <MenuItemForm
              hideRoleAndPermissionFields
              formPathPrefix={`client.registration.policies.${index}`}
            />
          </AccordionItem>
        ))}
      </Accordion>
      <DialogTrigger
        type="modal"
        onClose={value => {
          if (value) {
            append(value);
          }
        }}
      >
        <Button
          className="mt-12"
          variant="link"
          color="primary"
          startIcon={<AddIcon />}
          size="sm"
        >
          <Trans message="Add another policy" />
        </Button>
        <AddMenuItemDialog title={<Trans message="Add policy" />} />
      </DialogTrigger>
    </Fragment>
  );
}
