import {AdminDocsUrls} from '@app/admin/admin-config';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSelect, Option} from '@ui/forms/select/select';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {ComponentType, Fragment, ReactElement} from 'react';
import {useForm, useFormContext, useWatch} from 'react-hook-form';
import {AdminSettings} from '../../admin-settings';

type Props = {
  tabs: ReactElement;
  title: ReactElement<MessageDescriptor>;
};
export function WebsocketSettings({tabs, title}: Props) {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      server: {
        broadcast_connection: data.server.broadcast_connection ?? 'null',

        // pusher
        pusher_app_id: data.server.pusher_app_id ?? '',
        pusher_app_key: data.server.pusher_app_key ?? '',
        pusher_app_secret: data.server.pusher_app_secret ?? '',
        pusher_app_cluster: data.server.pusher_app_cluster ?? '',

        // reverb
        reverb_app_id: data.server.reverb_app_id ?? '',
        reverb_app_key: data.server.reverb_app_key ?? '',
        reverb_app_secret: data.server.reverb_app_secret ?? '',
        reverb_host: data.server.reverb_host ?? '',
        reverb_port: data.server.reverb_port ?? '8080',
        reverb_scheme: data.server.reverb_scheme ?? 'https',

        // ably
        ably_key: data.server.ably_key ?? '',
      },
    },
  });
  return (
    <AdminSettingsLayout form={form} title={title} tabs={tabs}>
      <DriverSection />
    </AdminSettingsLayout>
  );
}

function DriverSection() {
  const {clearErrors, control} = useFormContext<AdminSettings>();
  const driver = useWatch({
    control,
    name: 'server.broadcast_connection',
  });

  let CredentialSection: ComponentType<CredentialsProps> | null = null;
  if (driver === 'pusher') {
    CredentialSection = PusherFields;
  } else if (driver === 'ably') {
    CredentialSection = AblyFields;
  } else if (driver === 'reverb') {
    CredentialSection = ReverbFields;
  }
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Websockets Provider" />}
      description={
        <Trans message="Configure websockets provider responsible for all realtime functionality on the site." />
      }
      link={
        AdminDocsUrls.settings.websockets ? (
          <DocsLink link={AdminDocsUrls.settings.websockets}>
            <Trans message="What are websockets?" />
          </DocsLink>
        ) : null
      }
    >
      <SettingsErrorGroup
        separatorTop={false}
        separatorBottom={false}
        name="websockets_group"
      >
        {isInvalid => (
          <Fragment>
            <FormSelect
              size="sm"
              invalid={isInvalid}
              onSelectionChange={() => clearErrors()}
              selectionMode="single"
              name="server.broadcast_connection"
              required
            >
              <Option value="null">
                <Trans message="None (Disabled)" />
              </Option>
              <Option value="reverb">Local (Laravel Reverb)</Option>
              <Option value="pusher">Pusher</Option>
              <Option value="ably">
                <Trans message="Ably" />
              </Option>
            </FormSelect>
            {CredentialSection && (
              <div className="mt-30">
                <CredentialSection isInvalid={isInvalid} />
              </div>
            )}
          </Fragment>
        )}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}

interface CredentialsProps {
  isInvalid: boolean;
}
function PusherFields({isInvalid}: CredentialsProps) {
  return (
    <Fragment>
      <FormTextField
        size="sm"
        name="server.pusher_app_id"
        label={<Trans message="Pusher app ID" />}
        className="mb-20"
        required
      />
      <FormTextField
        size="sm"
        name="server.pusher_app_key"
        label={<Trans message="Pusher app key" />}
        className="mb-20"
        required
      />
      <FormTextField
        size="sm"
        name="server.pusher_app_secret"
        label={<Trans message="Pusher app secret" />}
        className="mb-20"
        required
      />
      <FormTextField
        size="sm"
        name="server.pusher_app_cluster"
        label={<Trans message="Pusher app cluster" />}
        className="mb-20"
        placeholder="mt1"
        required
      />
    </Fragment>
  );
}

function AblyFields({isInvalid}: CredentialsProps) {
  return (
    <Fragment>
      <FormTextField
        size="sm"
        name="server.ably_key"
        label={<Trans message="Ably API key" />}
        className="mb-20"
        required
      />
    </Fragment>
  );
}

function ReverbFields({isInvalid}: CredentialsProps) {
  return (
    <Fragment>
      <FormTextField
        size="sm"
        name="server.reverb_host"
        label={<Trans message="Reverb host" />}
        className="mb-20"
        required
      />
      <FormTextField
        size="sm"
        name="server.reverb_port"
        label={<Trans message="Reverb port" />}
        className="mb-20"
        required
      />
      <FormSelect
        size="sm"
        name="server.reverb_scheme"
        label={<Trans message="Reverb scheme" />}
        className="mb-20"
        required
      >
        <Option value="http">HTTP</Option>
        <Option value="https">HTTPS</Option>
      </FormSelect>
    </Fragment>
  );
}
