import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {
  SettingsPanel,
  SettingsSectionHeader,
} from '@common/admin/settings/layout/settings-panel';
import {BackendsSection} from '@common/admin/settings/pages/uploading-settings/backends/backends-section';
import {useMaxServerUploadSize} from '@common/admin/settings/pages/uploading-settings/max-server-upload-size';
import {UploadTypesSection} from '@common/admin/settings/pages/uploading-settings/upload-types-section';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {SectionHelper} from '@common/ui/other/section-helper';
import {FormFileSizeField} from '@common/uploads/components/file-size-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {useForm} from 'react-hook-form';

export function Component() {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      client: {
        uploading: data.client.uploading ?? {},
      },
      server: {
        static_file_delivery: data.server.static_file_delivery ?? '',
      },
    },
  });

  return (
    <AdminSettingsLayout
      form={form}
      title={<Trans message="Uploading" />}
      docsLink={AdminDocsUrls.settings.uploading}
    >
      <BackendsSection />
      <UploadTypesSection />
      <GlobalSettingsPanel />
    </AdminSettingsLayout>
  );
}

function GlobalSettingsPanel() {
  return (
    <div>
      <SettingsSectionHeader margin="mt-44 mb-12" size="lg">
        <Trans message="Global settings" />
        <Trans message="Settings that will apply to all upload types and backends." />
      </SettingsSectionHeader>
      <FileDeliveryPanel />
      <ChunkSizePanel />
    </div>
  );
}

function FileDeliveryPanel() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="File preview optimization (local backend only)" />}
      description={
        <Trans message="Integrate with X-Sendfile or X-Accel on the server to improve file preview performance." />
      }
    >
      <SettingsErrorGroup
        name="static_delivery_group"
        separatorBottom={false}
        separatorTop={false}
      >
        {isInvalid => (
          <FormSelect
            invalid={isInvalid}
            size="sm"
            name="server.static_file_delivery"
          >
            <Item value="">
              <Trans message="None" />
            </Item>
            <Item value="xsendfile">
              <Trans message="X-Sendfile (Apache)" />
            </Item>
            <Item value="xaccel">
              <Trans message="X-Accel (Nginx)" />
            </Item>
          </FormSelect>
        )}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}

function ChunkSizePanel() {
  const {data} = useMaxServerUploadSize();
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Chunk Size" />}
      description={
        <Trans message="Upload larger files in specified size chunks to improve upload speed and allow resumable uploads." />
      }
    >
      <FormFileSizeField size="sm" name="client.uploading.chunk_size" />
      <SectionHelper
        className="mt-12"
        color="warning"
        size="sm"
        description={
          <Trans
            message="Maximum upload size on your server currently is set to <b>:size</b>"
            values={{size: data?.maxSize, b: chunks => <b>{chunks}</b>}}
          />
        }
      />
    </SettingsPanel>
  );
}
