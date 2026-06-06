import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsSectionHeader} from '@common/admin/settings/layout/settings-panel';
import {CrupdateImapConnectionDialog} from '@common/admin/settings/pages/email-settings/incoming-email/crupdate-imap-connection-dialog';
import {MailTabs} from '@common/admin/settings/pages/email-settings/mail-tabs';
import {ConnectGmailPanel} from '@common/admin/settings/pages/email-settings/outgoing-email/connect-gmail-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {Accordion, AccordionItem} from '@ui/accordion/accordion';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {DeleteIcon} from '@ui/icons/material/Delete';
import {SettingsIcon} from '@ui/icons/material/Settings';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useSettings} from '@ui/settings/use-settings';
import {Tooltip} from '@ui/tooltip/tooltip';
import {useLocalStorage} from '@ui/utils/hooks/local-storage';
import clsx from 'clsx';
import {Fragment} from 'react';
import {useFieldArray, useForm, useFormContext} from 'react-hook-form';

export function Component() {
  const [expandedValues, setExpandedValues] = useLocalStorage<number[]>(
    'incoming-email-settings-expanded',
    [0, 1, 2],
  );

  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      client: {
        incoming_email: {
          imap: data.client.incoming_email?.imap ?? {
            connections: [],
          },
          api: {
            enabled: data.client.incoming_email?.api?.enabled ?? false,
          },
          mailgun: {
            enabled: data.client.incoming_email?.mailgun?.enabled ?? false,
            verify: data.client.incoming_email?.mailgun?.verify ?? false,
          },
          pipe: {
            enabled: data.client.incoming_email?.pipe?.enabled ?? false,
          },
          gmail: {
            enabled: data.client.incoming_email?.gmail?.enabled ?? false,
            topicName: data.client.incoming_email?.gmail?.topicName ?? '',
          },
        },
      },
      server: {
        mailgun_secret: data.server.mailgun_secret ?? '',
      },
    },
  });

  return (
    <AdminSettingsLayout
      form={form}
      title={<Trans message="Email" />}
      tabs={<MailTabs />}
    >
      <SettingsSectionHeader margin="mt-24" size="lg">
        <Trans message="Email handlers" />
        <Trans message="Configure different handlers for turning incoming emails into tickets and replies. You can enable multiple handlers at the same time." />
      </SettingsSectionHeader>
      <DocsLink
        className="mb-24 mt-8 text-sm"
        link={AdminDocsUrls.settings.incomingEmail}
      />
      <Accordion
        variant="outline"
        mode="multiple"
        expandedValues={expandedValues ?? []}
        onExpandedChange={values => setExpandedValues(values as number[])}
      >
        <AccordionItem label={<Trans message="IMAP" />}>
          <ImapPanel />
        </AccordionItem>
        <AccordionItem label={<Trans message="Pipe" />}>
          <PipePanel />
        </AccordionItem>
        <AccordionItem label={<Trans message="Rest API" />}>
          <ApiPanel />
        </AccordionItem>
        <AccordionItem label={<Trans message="Gmail API" />}>
          <GmailPanel />
        </AccordionItem>
        <AccordionItem label={<Trans message="Mailgun" />}>
          <MailgunPanel />
        </AccordionItem>
      </Accordion>
    </AdminSettingsLayout>
  );
}

function ApiPanel() {
  const {
    base_url,
    branding: {site_name},
  } = useSettings();
  return (
    <div>
      <FormSwitch name="client.incoming_email.api.enabled">
        <Trans message="Enabled" />
      </FormSwitch>
      <p className="mt-10 text-xs text-muted">
        <Trans
          message="Send emails to :siteName from a 3rd party application or a different website using REST API."
          values={{siteName: site_name}}
        />
      </p>
      <DocsLink
        className="mt-12 text-sm"
        link={`${base_url}/api-docs#Tickets-incomingEmail`}
      >
        <Trans message="API docs" />
      </DocsLink>
    </div>
  );
}

function MailgunPanel() {
  const {
    branding: {site_name},
  } = useSettings();
  return (
    <div>
      <FormSwitch name="client.incoming_email.mailgun.enabled">
        <Trans message="Enabled" />
      </FormSwitch>
      <p className="mt-10 text-xs text-muted">
        <Trans
          message="Send emails to :siteName using Mailgun inbound routes functionality."
          values={{siteName: site_name}}
        />
      </p>
      <FormTextField
        size="sm"
        className="mt-20"
        name="server.mailgun_secret"
        label={<Trans message="Mailgun API key" />}
      />
      <FormSwitch
        className="mt-14"
        name="client.incoming_email.mailgun.verify"
        description={
          <Trans message="Verify that incoming request is really from mailgun. It's highly recommended to have this on, unless you are not able to receive emails from mailgun otherwise." />
        }
      >
        <Trans message="Verify" />
      </FormSwitch>
    </div>
  );
}

function GmailPanel() {
  const {
    branding: {site_name},
  } = useSettings();
  const {watch} = useFormContext<AdminSettings>();
  const isEnabled = watch('client.incoming_email.gmail.enabled');
  return (
    <SettingsErrorGroup
      name="gmail_group"
      separatorBottom={false}
      separatorTop={false}
    >
      {isInvalid => (
        <Fragment>
          <FormSwitch
            name="client.incoming_email.gmail.enabled"
            invalid={isInvalid}
          >
            <Trans message="Enabled" />
          </FormSwitch>
          <p className="mt-10 text-xs text-muted">
            <Trans
              message="Connect your existing gmail acocunt using gmail API."
              values={{siteName: site_name}}
            />
          </p>
          <FormTextField
            invalid={isInvalid}
            name="client.incoming_email.gmail.topicName"
            minLength={10}
            required={isEnabled}
            label={<Trans message="Gmail topic name" />}
            description={<Trans message="Google cloud Pub/Sub topic name." />}
            className="my-20"
            size="sm"
          />
          <ConnectGmailPanel />
        </Fragment>
      )}
    </SettingsErrorGroup>
  );
}

function PipePanel() {
  const {
    branding: {site_name},
  } = useSettings();
  return (
    <div>
      <FormSwitch name="client.incoming_email.pipe.enabled">
        <Trans message="Enabled" />
      </FormSwitch>
      <p className="mt-10 text-xs text-muted">
        <Trans
          message="Pipe emails to :siteName from cpanel or another control panel used by your hosting provider."
          values={{siteName: site_name}}
        />
      </p>
    </div>
  );
}

function ImapPanel() {
  const {
    branding: {site_name},
  } = useSettings();
  const {fields, append, remove, update} = useFieldArray<
    AdminSettings,
    'client.incoming_email.imap.connections',
    'key'
  >({
    name: 'client.incoming_email.imap.connections',
    keyName: 'key',
  });

  return (
    <SettingsErrorGroup
      name="imap_group"
      separatorBottom={false}
      separatorTop={false}
    >
      {isInvalid => (
        <Fragment>
          <p className="mb-10 text-xs text-muted">
            <Trans
              message="Connect your existing email accounts to :siteName using IMAP."
              values={{siteName: site_name}}
            />
          </p>
          <div className="mb-20 space-y-14">
            {fields.map((field, index) => (
              <div
                className={clsx(
                  'flex items-center',
                  isInvalid && 'text-danger',
                )}
                key={field.key}
              >
                <div className="mr-auto">
                  <div>{field.name}</div>
                  <div className="text-xs text-muted">{field.username}</div>
                </div>
                <DialogTrigger
                  type="modal"
                  onClose={updatedConnection => {
                    if (updatedConnection) {
                      update(index, updatedConnection);
                    }
                  }}
                >
                  <Tooltip label={<Trans message="Edit" />}>
                    <IconButton size="sm" className="text-muted">
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                  <CrupdateImapConnectionDialog connection={field} />
                </DialogTrigger>
                <Tooltip label={<Trans message="Delete" />}>
                  <IconButton
                    size="sm"
                    className="text-muted"
                    onClick={() => remove(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </div>
            ))}
          </div>
          <DialogTrigger
            type="modal"
            onClose={connection => {
              if (connection) {
                append(connection);
              }
            }}
          >
            <Button
              variant="outline"
              color="primary"
              startIcon={<AddIcon />}
              size="xs"
            >
              <Trans message="Add connection" />
            </Button>
            <CrupdateImapConnectionDialog />
          </DialogTrigger>
        </Fragment>
      )}
    </SettingsErrorGroup>
  );
}
