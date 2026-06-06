import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';

export interface MailgunCredentialsProps {
  isInvalid: boolean;
}
export function MailgunCredentials({isInvalid}: MailgunCredentialsProps) {
  return (
    <Fragment>
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        name="server.mailgun_domain"
        label={<Trans message="Mailgun domain" />}
        description={
          <Trans message="Usually the domain of your site (site.com)" />
        }
        required
      />
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        name="server.mailgun_secret"
        label={<Trans message="Mailgun API key" />}
        description={<Trans message="Should start with `key-`" />}
        required
      />
      <FormTextField
        size="sm"
        invalid={isInvalid}
        name="server.mailgun_endpoint"
        label={<Trans message="Mailgun endpoint" />}
        description={
          <Trans message="Can be left empty, if your mailgun account is in the US region." />
        }
        placeholder="api.eu.mailgun.net"
      />
    </Fragment>
  );
}
