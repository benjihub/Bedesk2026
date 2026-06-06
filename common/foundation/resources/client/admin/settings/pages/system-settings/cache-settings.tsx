import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {apiClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {SectionHelper} from '@common/ui/other/section-helper';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSelect, Option} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {toast} from '@ui/toast/toast';
import {ComponentType, Fragment, ReactElement} from 'react';
import {useForm, useFormContext} from 'react-hook-form';

interface Props {
  tabs: ReactElement;
  title: ReactElement<MessageDescriptor>;
}
export function CacheSettings({tabs, title}: Props) {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      server: {
        cache_store: data.server.cache_store ?? 'file',
        memcached_host: data.server.memcached_host ?? '',
        memcached_port: data.server.memcached_port ?? '',
      },
    },
  });
  return (
    <AdminSettingsLayout form={form} title={title} tabs={tabs}>
      <CacheProviderPanel />
      <ClearCachePanel />
    </AdminSettingsLayout>
  );
}

export function CacheProviderPanel() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Cache Provider" />}
      description={
        <Trans message="Configure which method should be used for storing and retrieving cached items." />
      }
      link={
        AdminDocsUrls.settings.cache ? (
          <DocsLink link={AdminDocsUrls.settings.cache} />
        ) : undefined
      }
    >
      <CacheSelect />
      <SectionHelper
        size="sm"
        color="warning"
        className="mt-12"
        description={
          <Trans
            message={
              '"File" is a good default, but other providers can provide better peformance, however they require extra setup on the server.'
            }
          />
        }
      />
    </SettingsPanel>
  );
}

export function ClearCachePanel() {
  const clearCache = useClearCache();
  return (
    <SettingsPanel
      title={<Trans message="Clear Cache" />}
      description={
        <Trans message="Clear application cache if you're experiencing issues with stale data." />
      }
    >
      <Button
        type="button"
        variant="outline"
        size="xs"
        color="primary"
        disabled={clearCache.isPending}
        onClick={() => clearCache.mutate()}
      >
        <Trans message="Clear cache" />
      </Button>
    </SettingsPanel>
  );
}

function CacheSelect() {
  const {watch, clearErrors} = useFormContext<AdminSettings>();
  const cacheStore = watch('server.cache_store');

  let CredentialSection: ComponentType<CredentialProps> | null = null;
  if (cacheStore === 'memcached') {
    CredentialSection = MemcachedCredentials;
  }

  return (
    <SettingsErrorGroup
      separatorTop={false}
      separatorBottom={false}
      name="cache_group"
    >
      {isInvalid => {
        return (
          <Fragment>
            <FormSelect
              size="sm"
              invalid={isInvalid}
              onSelectionChange={() => clearErrors()}
              selectionMode="single"
              name="server.cache_store"
            >
              <Option value="file">
                <Trans message="File (Default)" />
              </Option>
              <Option value="array">
                <Trans message="None" />
              </Option>
              <Option value="apc">APC</Option>
              <Option value="memcached">Memcached</Option>
              <Option value="redis">Redis</Option>
            </FormSelect>
            {CredentialSection && (
              <div className="mt-20">
                <CredentialSection isInvalid={isInvalid} />
              </div>
            )}
          </Fragment>
        );
      }}
    </SettingsErrorGroup>
  );
}

interface CredentialProps {
  isInvalid: boolean;
}
function MemcachedCredentials({isInvalid}: CredentialProps) {
  return (
    <Fragment>
      <FormTextField
        size="sm"
        invalid={isInvalid}
        className="mb-20"
        name="server.memcached_host"
        label={<Trans message="Memcached host" />}
        required
      />
      <FormTextField
        size="sm"
        invalid={isInvalid}
        type="number"
        name="server.memcached_port"
        label={<Trans message="Memcached port" />}
        required
      />
    </Fragment>
  );
}

function useClearCache() {
  return useMutation({
    mutationFn: () => apiClient.post('cache/flush').then(r => r.data),
    onSuccess: () => {
      toast(message('Cache cleared'));
    },
    onError: err => showHttpErrorToast(err),
  });
}
