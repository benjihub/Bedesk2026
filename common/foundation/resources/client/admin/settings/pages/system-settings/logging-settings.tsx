import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {ExternalLink} from '@ui/buttons/external-link';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {ReactElement} from 'react';
import {useForm, useFormContext} from 'react-hook-form';

interface Props {
  tabs: ReactElement;
  title: ReactElement<MessageDescriptor>;
}
export function LoggingSettings({tabs, title}: Props) {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      server: {
        sentry_dsn: data.server.sentry_dsn ?? '',
      },
    },
  });
  return (
    <AdminSettingsLayout form={form} title={title} tabs={tabs}>
      <SentryPanel />
    </AdminSettingsLayout>
  );
}

function SentryPanel() {
  const {clearErrors} = useFormContext();
  return (
    <SettingsPanel
      title={<Trans message="Sentry Integration" />}
      description={
        <Trans
          values={{
            a: parts => (
              <ExternalLink href="https://sentry.io">{parts}</ExternalLink>
            ),
          }}
          message="<a>Sentry</a> integration provides real-time error tracking and helps identify and fix issues when site is in production."
        />
      }
      link={
        AdminDocsUrls.settings.logging ? (
          <DocsLink link={AdminDocsUrls.settings.logging} />
        ) : null
      }
    >
      <SettingsErrorGroup
        separatorTop={false}
        separatorBottom={false}
        name="logging_group"
      >
        {isInvalid => {
          return (
            <FormTextField
              size="sm"
              onChange={() => clearErrors()}
              invalid={isInvalid}
              name="server.sentry_dsn"
              type="url"
              minLength={30}
              label={<Trans message="Sentry DSN" />}
            />
          );
        }}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}
