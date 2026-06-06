import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {OutoingEmailNotSetupWarning} from '@common/admin/settings/layout/outoing-email-not-configured-warning';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {MailTabs} from '@common/admin/settings/pages/email-settings/mail-tabs';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {SectionHelper} from '@common/ui/other/section-helper';
import {ExternalLink} from '@ui/buttons/external-link';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {useForm} from 'react-hook-form';
import {OutgoingMailGroup} from './outgoing-mail-group';

export function Component() {
  const {incoming_email} = useSettings();
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      server: {
        mail_from_address: data.server.mail_from_address ?? '',
        mail_from_name: data.server.mail_from_name ?? '',
        mail_mailer: data.server.mail_mailer ?? '',
        mailgun_domain: data.server.mailgun_domain ?? '',
        mailgun_secret: data.server.mailgun_secret ?? '',
        mailgun_endpoint: data.server.mailgun_endpoint ?? '',
        mail_host: data.server.mail_host ?? '',
        mail_username: data.server.mail_username ?? '',
        mail_password: data.server.mail_password ?? '',
        mail_port: data.server.mail_port ?? '',
        mail_encryption: data.server.mail_encryption ?? '',
        ses_key: data.server.ses_key ?? '',
        ses_secret: data.server.ses_secret ?? '',
        ses_region: data.server.ses_region ?? '',
        postmark_token: data.server.postmark_token ?? '',
        connectedGmailAccount: data.server.connectedGmailAccount ?? '',
      },
      client: {
        mail: {
          contact_page_address: data.client.mail?.contact_page_address ?? '',
        },
      },
    },
  });
  return (
    <AdminSettingsLayout
      form={form}
      title={<Trans message="Email" />}
      tabs={incoming_email?.integrated ? <MailTabs /> : undefined}
    >
      <OutoingEmailNotSetupWarning />
      <FromInformationPanel />
      <ContactAddressPanel />
      <OutgoingMailMethodPanel />
    </AdminSettingsLayout>
  );
}

function FromInformationPanel() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="From Information" />}
      description={
        <Trans message="Configure the sender information for all outgoing application emails." />
      }
    >
      <FormTextField
        size="sm"
        type="email"
        name="server.mail_from_address"
        label={<Trans message="From address" />}
        description={
          <Trans message="All outgoing application emails will be sent from this email address." />
        }
        required
        className="mb-20"
      />
      <FormTextField
        size="sm"
        name="server.mail_from_name"
        label={<Trans message="From name" />}
        description={
          <Trans message="All outgoing application emails will be sent using this name." />
        }
        required
        className="mb-20"
      />
      <SectionHelper
        size="sm"
        color="warning"
        description={
          <Trans message="Your selected mail method must be authorized to send emails using this address and name." />
        }
      />
    </SettingsPanel>
  );
}

function ContactAddressPanel() {
  const {base_url} = useSettings();
  const {data} = useAdminSettings();
  const contactPageUrl = `${base_url}/contact`;

  if (!data.server.enable_contact_page) {
    return null;
  }

  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Contact Page" />}
      description={
        <Trans message="Configure where contact form submissions should be sent." />
      }
    >
      <FormTextField
        size="sm"
        type="email"
        name="client.mail.contact_page_address"
        label={<Trans message="Contact page address" />}
        description={
          <Trans
            values={{
              contactPageUrl: (
                <ExternalLink href={contactPageUrl}>
                  {contactPageUrl}
                </ExternalLink>
              ),
            }}
            message="Where emails from :contactPageUrl page should be sent to."
          />
        }
      />
    </SettingsPanel>
  );
}

function OutgoingMailMethodPanel() {
  return (
    <SettingsPanel
      title={<Trans message="Outgoing Mail Method" />}
      description={
        <Trans message="Configure which method should be used for sending outgoing application emails." />
      }
      link={
        AdminDocsUrls.settings.outgoingEmail ? (
          <DocsLink link={AdminDocsUrls.settings.outgoingEmail} />
        ) : undefined
      }
    >
      <OutgoingMailGroup />
    </SettingsPanel>
  );
}
