import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {FormFileField} from '@ui/forms/input-field/file-field';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';
import {useForm, useFormContext} from 'react-hook-form';

export function Component() {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      files: {
        // form will be marked as dirty without this
        certificate: '' as unknown as undefined,
      },
      server: {
        analytics_property_id: data.server.analytics_property_id ?? '',
      },
      client: {
        analytics: {
          tracking_code: data.client.analytics?.tracking_code ?? '',
          gchart_api_key: data.client.analytics?.gchart_api_key ?? '',
        },
      },
    },
  });

  return (
    <AdminSettingsLayout title={<Trans message="Analytics" />} form={form}>
      <GoogleAnalyticsPanel />
    </AdminSettingsLayout>
  );
}

function GoogleAnalyticsPanel() {
  const {clearErrors} = useFormContext();
  return (
    <SettingsPanel
      layout="vertical"
      title={<Trans message="Google Analytics" />}
      description={
        <Trans message="Configure Google Analytics integration for tracking site usage and displaying statistics." />
      }
      link={
        AdminDocsUrls.settings.googleAnalytics ? (
          <DocsLink link={AdminDocsUrls.settings.googleAnalytics} />
        ) : null
      }
    >
      <SettingsErrorGroup
        separatorTop={false}
        separatorBottom={false}
        name="analytics_group"
      >
        {isInvalid => (
          <Fragment>
            <FormFileField
              size="md"
              className="mb-20"
              onChange={() => clearErrors()}
              invalid={isInvalid}
              name="files.certificate"
              accept=".json"
              label={
                <Trans message="Google service account key file (.json)" />
              }
            />
            <FormTextField
              size="sm"
              className="mb-20"
              onChange={() => clearErrors()}
              invalid={isInvalid}
              name="server.analytics_property_id"
              type="number"
              label={<Trans message="Google analytics property ID" />}
            />
            <FormTextField
              size="sm"
              className="mb-20"
              onChange={() => clearErrors()}
              invalid={isInvalid}
              name="client.analytics.tracking_code"
              placeholder="G-******"
              min="1"
              max="20"
              description={
                <Trans message="Google analytics measurement ID only, not the whole javascript snippet." />
              }
              label={<Trans message="Google tag manager measurement ID" />}
            />
            <FormTextField
              size="sm"
              name="client.analytics.gchart_api_key"
              label={<Trans message="Google maps javascript API key" />}
              description={
                <Trans message="Only required in order to show world geochart on integrated analytics pages." />
              }
            />
          </Fragment>
        )}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}
