import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {FormSelect, Option} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {ComponentType, Fragment} from 'react';
import {useFormContext} from 'react-hook-form';
import {ConnectGmailPanel} from './connect-gmail-panel';
import {MailgunCredentials} from './mailgun-credentials';
import {PostmarkCredentials} from './postmark-credentials';
import {SesCredentials} from './ses-credentials';
import {SmtpCredentials} from './smtp-credentials';

export function OutgoingMailGroup() {
  const {watch, clearErrors} = useFormContext<AdminSettings>();

  const selectedDriver = watch('server.mail_mailer');
  const credentialForms: ComponentType<{isInvalid: boolean}>[] = [];

  if (selectedDriver === 'mailgun') {
    credentialForms.push(MailgunCredentials);
  }
  if (selectedDriver === 'smtp') {
    credentialForms.push(SmtpCredentials);
  }
  if (selectedDriver === 'ses') {
    credentialForms.push(SesCredentials);
  }
  if (selectedDriver === 'postmark') {
    credentialForms.push(PostmarkCredentials);
  }
  if (selectedDriver === 'gmailApi') {
    credentialForms.push(ConnectGmailPanel);
  }

  return (
    <SettingsErrorGroup
      separatorTop={false}
      separatorBottom={false}
      name="mail_group"
    >
      {isInvalid => (
        <Fragment>
          <FormSelect
            size="sm"
            onSelectionChange={() => {
              clearErrors();
            }}
            invalid={isInvalid}
            selectionMode="single"
            name="server.mail_mailer"
            label={<Trans message="Outgoing mail method" />}
          >
            <Option value="mailgun">Mailgun</Option>
            <Option value="gmailApi">Gmail Api</Option>
            <Option value="smtp">SMTP</Option>
            <Option value="postmark">Postmark</Option>
            <Option value="ses">Ses (Amazon Simple Email Service)</Option>
            <Option value="sendmail">SendMail</Option>
            <Option value="log">
              Log (Email will be saved to log file instead of sending)
            </Option>
          </FormSelect>
          {credentialForms.length ? (
            <div className="mt-30">
              {credentialForms.map((CredentialsForm, index) => (
                <CredentialsForm key={index} isInvalid={isInvalid} />
              ))}
            </div>
          ) : null}
        </Fragment>
      )}
    </SettingsErrorGroup>
  );
}
