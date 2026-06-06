import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {OutoingEmailNotSetupWarning} from '@common/admin/settings/layout/outoing-email-not-configured-warning';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {useForm, useFormContext} from 'react-hook-form';

export function Component() {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      client: {
        require_email_confirmation:
          data.client?.require_email_confirmation ?? false,
        registration: {
          disable: data.client.registration?.disable ?? false,
        },
        social: {
          requireAccount: data.client.social?.requireAccount ?? false,
          compact_buttons: data.client.social?.compact_buttons ?? false,
          envato: {
            enable: data.client.social?.envato?.enable ?? false,
          },
          google: {
            enable: data.client.social?.google?.enable ?? false,
          },
          facebook: {
            enable: data.client.social?.facebook?.enable ?? false,
          },
          twitter: {
            enable: data.client.social?.twitter?.enable ?? false,
          },
        },
        single_device_login: data.client.single_device_login ?? false,
        auth: {
          domain_blacklist: data.client.auth?.domain_blacklist ?? '',
        },
      },
      server: {
        envato_id: data.server?.envato_id ?? '',
        envato_secret: data.server?.envato_secret ?? '',
        envato_personal_token: data.server?.envato_personal_token ?? '',
        google_id: data.server?.google_id ?? '',
        google_secret: data.server?.google_secret ?? '',
        facebook_id: data.server?.facebook_id ?? '',
        facebook_secret: data.server?.facebook_secret ?? '',
        twitter_id: data.server?.twitter_id ?? '',
        twitter_secret: data.server?.twitter_secret ?? '',
        mail_setup: data.server?.mail_setup ?? false,
      },
    },
  });

  return (
    <AdminSettingsLayout
      form={form}
      title={<Trans message="Authentication" />}
      docsLink={AdminDocsUrls.settings.authentication}
    >
      <OutoingEmailNotSetupWarning />
      <RegistrationPanel />
      <SocialLoginSettingsPanel />
      <SingleDeviceLoginPanel />
      <DomainBlacklistPanel />
      <EnvatoSection />
      <GoogleSection />
      <FacebookSection />
      <TwitterSection />
    </AdminSettingsLayout>
  );
}

function RegistrationPanel() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Registration" />}
      description={<Trans message="Configure user registration settings." />}
    >
      <FormSwitch
        size="sm"
        className="mb-20"
        name="client.registration.disable"
        description={
          <Trans message="All registration related functionality will be disabled and hidden from users." />
        }
      >
        <Trans message="Disable registration" />
      </FormSwitch>
      <FormSwitch
        size="sm"
        name="client.require_email_confirmation"
        description={
          <Trans message="Require newly registered users to validate their email address before being able to login." />
        }
      >
        <Trans message="Require email confirmation" />
      </FormSwitch>
    </SettingsPanel>
  );
}

function SocialLoginSettingsPanel() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Social Login Settings" />}
      description={
        <Trans message="Configure general settings for social login." />
      }
    >
      <FormSwitch
        size="sm"
        className="mb-20"
        name="client.social.requireAccount"
        description={
          <Trans message="User will only be able to login via socials, if they have connected it from their account settings page." />
        }
      >
        <Trans message="Social login requires existing account" />
      </FormSwitch>
      <FormSwitch size="sm" name="client.social.compact_buttons">
        <Trans message="Use compact social login buttons" />
      </FormSwitch>
    </SettingsPanel>
  );
}

function SingleDeviceLoginPanel() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Single Device Login" />}
      description={
        <Trans message="Control how many devices can access an account simultaneously." />
      }
    >
      <FormSwitch size="sm" name="client.single_device_login">
        <Trans message="Single device login" />
      </FormSwitch>
    </SettingsPanel>
  );
}

function DomainBlacklistPanel() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Domain Blacklist" />}
      description={
        <Trans message="Comma separated list of domains. Users will not be able to register or login using any email adress from specified domains." />
      }
    >
      <FormTextField
        size="sm"
        name="client.auth.domain_blacklist"
        label={<Trans message="Domains" />}
        inputElementType="textarea"
        rows={1}
      />
    </SettingsPanel>
  );
}

function EnvatoSection() {
  const {watch} = useFormContext<AdminSettings>();
  const settings = useSettings();
  const envatoLoginEnabled = watch('client.social.envato.enable');

  if (!(settings as any).envato?.enable) return null;

  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Envato Login" />}
      description={
        <Trans message="Configure Envato authentication settings." />
      }
    >
      <SettingsErrorGroup
        separatorBottom={false}
        separatorTop={false}
        name="envato_group"
      >
        {isInvalid => (
          <>
            <FormSwitch
              size="sm"
              invalid={isInvalid}
              name="client.social.envato.enable"
              description={
                <Trans message="Enable logging into the site via envato." />
              }
            >
              <Trans message="Envato login" />
            </FormSwitch>
            {!!envatoLoginEnabled && (
              <>
                <FormTextField
                  size="sm"
                  invalid={isInvalid}
                  className="mt-20"
                  name="server.envato_id"
                  label={<Trans message="Envato ID" />}
                  required
                />
                <FormTextField
                  size="sm"
                  invalid={isInvalid}
                  className="mt-20"
                  name="server.envato_secret"
                  label={<Trans message="Envato secret" />}
                  required
                />
                <FormTextField
                  size="sm"
                  invalid={isInvalid}
                  className="mt-20"
                  name="server.envato_personal_token"
                  label={<Trans message="Envato personal token" />}
                  required
                />
              </>
            )}
          </>
        )}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}

function GoogleSection() {
  const {watch} = useFormContext<AdminSettings>();
  const googleLoginEnabled = watch('client.social.google.enable');

  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Google Login" />}
      description={
        <Trans message="Configure Google authentication settings." />
      }
    >
      <SettingsErrorGroup
        separatorBottom={false}
        separatorTop={false}
        name="google_group"
      >
        {isInvalid => (
          <>
            <FormSwitch
              size="sm"
              invalid={isInvalid}
              name="client.social.google.enable"
              description={
                <Trans message="Enable logging into the site via google." />
              }
            >
              <Trans message="Google login" />
            </FormSwitch>
            {!!googleLoginEnabled && (
              <>
                <FormTextField
                  size="sm"
                  invalid={isInvalid}
                  className="mt-20"
                  name="server.google_id"
                  label={<Trans message="Google client ID" />}
                  required
                />
                <FormTextField
                  size="sm"
                  className="mt-20"
                  name="server.google_secret"
                  label={<Trans message="Google client secret" />}
                  required
                />
              </>
            )}
          </>
        )}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}

function FacebookSection() {
  const {watch} = useFormContext<AdminSettings>();
  const facebookLoginEnabled = watch('client.social.facebook.enable');

  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Facebook Login" />}
      description={
        <Trans message="Configure Facebook authentication settings." />
      }
    >
      <SettingsErrorGroup
        separatorBottom={false}
        separatorTop={false}
        name="facebook_group"
      >
        {isInvalid => (
          <>
            <FormSwitch
              size="sm"
              invalid={isInvalid}
              name="client.social.facebook.enable"
              description={
                <Trans message="Enable logging into the site via facebook." />
              }
            >
              <Trans message="Facebook login" />
            </FormSwitch>
            {!!facebookLoginEnabled && (
              <>
                <FormTextField
                  size="sm"
                  invalid={isInvalid}
                  className="mt-20"
                  name="server.facebook_id"
                  label={<Trans message="Facebook app ID" />}
                  required
                />
                <FormTextField
                  size="sm"
                  invalid={isInvalid}
                  className="mt-20"
                  name="server.facebook_secret"
                  label={<Trans message="Facebook app secret" />}
                  required
                />
              </>
            )}
          </>
        )}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}

function TwitterSection() {
  const {watch} = useFormContext<AdminSettings>();
  const twitterLoginEnabled = watch('client.social.twitter.enable');

  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Twitter Login" />}
      description={
        <Trans message="Configure Twitter authentication settings." />
      }
    >
      <SettingsErrorGroup
        name="twitter_group"
        separatorTop={false}
        separatorBottom={false}
      >
        {isInvalid => (
          <>
            <FormSwitch
              size="sm"
              invalid={isInvalid}
              name="client.social.twitter.enable"
              description={
                <Trans message="Enable logging into the site via twitter." />
              }
            >
              <Trans message="Twitter login" />
            </FormSwitch>
            {!!twitterLoginEnabled && (
              <>
                <FormTextField
                  size="sm"
                  invalid={isInvalid}
                  className="mt-20"
                  name="server.twitter_id"
                  label={<Trans message="Twitter ID" />}
                  required
                />
                <FormTextField
                  size="sm"
                  invalid={isInvalid}
                  className="mt-20"
                  name="server.twitter_secret"
                  label={<Trans message="Twitter secret" />}
                  required
                />
              </>
            )}
          </>
        )}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}
