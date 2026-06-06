import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {CaptchaAction} from '@common/core/settings/base-backend-settings';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {Fragment, ReactNode} from 'react';
import {useForm, useFormContext, useWatch} from 'react-hook-form';

interface Props {
  children?: ReactNode;
  actions?: CaptchaAction[];
}
export function Component({children, actions}: Props) {
  const {data} = useAdminSettings();

  const defaultValues: {client: Partial<AdminSettings['client']>} = {
    client: {
      captcha: {
        provider: data.client.captcha?.provider ?? 'turnstile',
        enable: {
          contact: data.client.captcha?.enable?.contact ?? false,
          register: data.client.captcha?.enable?.register ?? false,
        },
        g_site_key: data.client.captcha?.g_site_key ?? '',
        g_secret_key: data.client.captcha?.g_secret_key ?? '',
        t_site_key: data.client.captcha?.t_site_key ?? '',
        t_secret_key: data.client.captcha?.t_secret_key ?? '',
      },
    },
  };

  actions?.forEach(action => {
    defaultValues.client.captcha!.enable![action] =
      data.client.captcha?.enable?.[action] ?? false;
  });

  const form = useForm<AdminSettings>({
    defaultValues,
  });

  return (
    <AdminSettingsLayout title={<Trans message="Captcha" />} form={form}>
      <EnableCaptchaPanel>{children}</EnableCaptchaPanel>
      <CaptchaCredentialsPanel />
    </AdminSettingsLayout>
  );
}

interface EnableCaptchaPanelProps {
  children?: ReactNode;
}
function EnableCaptchaPanel({children}: EnableCaptchaPanelProps) {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Enable captcha" />}
      description={
        <Trans message="Select which pages should be protected by captcha." />
      }
      link={
        AdminDocsUrls.settings.captcha ? (
          <DocsLink link={AdminDocsUrls.settings.captcha}>
            <Trans message="What is captcha?" />
          </DocsLink>
        ) : null
      }
    >
      {children}
      <FormSwitch
        className="mb-20"
        name="client.captcha.enable.contact"
        description={
          <Trans
            message={'Enable captcha integration for "contact us" page.'}
          />
        }
      >
        <Trans message="Contact page" />
      </FormSwitch>
      <FormSwitch
        name="client.captcha.enable.register"
        description={
          <Trans message="Enable captcha integration for registration page." />
        }
      >
        <Trans message="Registration page" />
      </FormSwitch>
    </SettingsPanel>
  );
}

function CaptchaCredentialsPanel() {
  return (
    <SettingsPanel
      title={<Trans message="Provider & credentials" />}
      description={
        <Trans message="Select captcha provider and enter your API credentials." />
      }
    >
      <SettingsErrorGroup
        separatorTop={false}
        separatorBottom={false}
        name="captcha_group"
      >
        {isInvalid => {
          return (
            <Fragment>
              <FormSelect
                size="sm"
                name="client.captcha.provider"
                label={<Trans message="Captcha provider" />}
                className="mb-20"
              >
                <Item value="recaptcha">
                  <Trans message="Google reCAPTCHA" />
                </Item>
                <Item value="turnstile">
                  <Trans message="Cloudflare Turnstile" />
                </Item>
              </FormSelect>
              <CaptchaKeysFields isInvalid={isInvalid} />
            </Fragment>
          );
        }}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}

interface CaptchaKeysFieldsProps {
  isInvalid: boolean;
}
function CaptchaKeysFields({isInvalid}: CaptchaKeysFieldsProps) {
  const {clearErrors} = useFormContext();
  const provider = useWatch<AdminSettings>({name: 'client.captcha.provider'});

  if (provider === 'turnstile') {
    return (
      <Fragment key={provider}>
        <FormTextField
          size="sm"
          className="mb-20"
          onChange={() => {
            clearErrors();
          }}
          invalid={isInvalid}
          name="client.captcha.t_site_key"
          label={<Trans message="Turnstile site key" />}
        />
        <FormTextField
          size="sm"
          onChange={() => {
            clearErrors();
          }}
          invalid={isInvalid}
          name="client.captcha.t_secret_key"
          label={<Trans message="Turnstile secret key" />}
        />
      </Fragment>
    );
  }

  return (
    <Fragment key={provider}>
      <FormTextField
        size="sm"
        className="mb-20"
        onChange={() => {
          clearErrors();
        }}
        invalid={isInvalid}
        name="client.captcha.g_site_key"
        label={<Trans message="Google reCAPTCHA site key" />}
      />
      <FormTextField
        size="sm"
        onChange={() => {
          clearErrors();
        }}
        invalid={isInvalid}
        name="client.captcha.g_secret_key"
        label={<Trans message="Google reCAPTCHA secret key" />}
      />
    </Fragment>
  );
}
