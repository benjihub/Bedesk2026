import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';

export interface SmtpCredentialsProps {
  isInvalid: boolean;
}
export function SmtpCredentials({isInvalid}: SmtpCredentialsProps) {
  return (
    <>
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        name="server.mail_host"
        label={<Trans message="SMTP host" />}
        required
      />
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        name="server.mail_username"
        label={<Trans message="SMTP username" />}
        required
      />
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        type="password"
        name="server.mail_password"
        label={<Trans message="SMTP password" />}
        required
      />
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        type="number"
        name="server.mail_port"
        label={<Trans message="SMTP port" />}
      />
      <FormSelect
        size="sm"
        selectionMode="single"
        invalid={isInvalid}
        name="server.mail_encryption"
        label={<Trans message="SMTP encryption" />}
      >
        <Item value="">
          <Trans message="None" />
        </Item>
        <Item value="tls">
          <Trans message="TLS" />
        </Item>
        <Item value="ssl">
          <Trans message="SSL" />
        </Item>
      </FormSelect>
    </>
  );
}
