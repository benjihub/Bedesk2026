import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {SettingsErrorGroup} from '@common/admin/settings/layout/settings-error-group';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useImportSearchModels} from '@common/admin/settings/pages/search-settings/requests/use-import-search-models';
import {useSearchModels} from '@common/admin/settings/pages/search-settings/requests/use-search-models';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {SectionHelper} from '@common/ui/other/section-helper';
import {Button} from '@ui/buttons/button';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect, Select} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {Fragment, useState} from 'react';
import {useForm, useFormContext} from 'react-hook-form';

export function Component() {
  const {data} = useAdminSettings();
  const form = useForm<AdminSettings>({
    defaultValues: {
      server: {
        scout_driver: data.server.scout_driver ?? 'mysql',
        scout_mysql_mode: data.server.scout_mysql_mode ?? 'basic',
        algolia_app_id: data.server.algolia_app_id ?? '',
        algolia_secret: data.server.algolia_secret ?? '',
      },
    },
  });

  return (
    <AdminSettingsLayout form={form} title={<Trans message="Search" />}>
      <SearchMethodSection />
      <ImportRecordsPanel />
    </AdminSettingsLayout>
  );
}

function SearchMethodSection() {
  const {watch} = useFormContext<AdminSettings>();
  const selectedMethod = watch('server.scout_driver');

  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Search Method" />}
      description={
        <div>
          <Trans message="Configure which search method should be used for search functionality across your site." />
        </div>
      }
      link={
        AdminDocsUrls.settings.search ? (
          <DocsLink link={AdminDocsUrls.settings.search}>
            <Trans message="What's the difference between the search methods?" />
          </DocsLink>
        ) : null
      }
    >
      <SettingsErrorGroup
        name="search_group"
        separatorBottom={false}
        separatorTop={false}
      >
        {isInvalid => (
          <Fragment>
            <FormSelect
              size="sm"
              invalid={isInvalid}
              name="server.scout_driver"
              selectionMode="single"
              label={<Trans message="Search method" />}
            >
              <Item value="mysql">Database (Default)</Item>
              <Item value="meilisearch">Meilisearch (Recommended)</Item>
              <Item value="tntsearch">TNTSearch</Item>
              <Item value="algolia">Algolia</Item>
            </FormSelect>
            {selectedMethod === 'mysql' && <MysqlFields />}
            {selectedMethod === 'meilisearch' && <MeilisearchFields />}
            {selectedMethod === 'algolia' && <AlgoliaFields />}
          </Fragment>
        )}
      </SettingsErrorGroup>
    </SettingsPanel>
  );
}

function MysqlFields() {
  const {clearErrors} = useFormContext<AdminSettings>();
  return (
    <FormSelect
      size="sm"
      className="mt-24"
      name="server.scout_mysql_mode"
      selectionMode="single"
      label={<Trans message="Database search mode" />}
      onSelectionChange={() => {
        clearErrors();
      }}
    >
      <Item value="basic">
        <Trans message="Basic" />
      </Item>
      <Item value="extended">
        <Trans message="Extended" />
      </Item>
      <Item value="fulltext">
        <Trans message="Fulltext" />
      </Item>
    </FormSelect>
  );
}

function MeilisearchFields() {
  return (
    <SectionHelper
      className="mt-24"
      color="warning"
      description={
        <Trans
          message="<a>Meilisearch</a> needs to be installed and running for this method to work."
          values={{
            a: parts => (
              <a
                href="https://www.meilisearch.com"
                target="_blank"
                rel="noreferrer"
              >
                {parts}
              </a>
            ),
          }}
        />
      }
    />
  );
}

function AlgoliaFields() {
  return (
    <Fragment>
      <FormTextField
        size="sm"
        className="mt-24"
        name="server.algolia_app_id"
        label={<Trans message="Algolia app ID" />}
        required
      />
      <FormTextField
        size="sm"
        className="mt-24"
        name="server.algolia_secret"
        label={<Trans message="Algolia app secret" />}
        required
      />
    </Fragment>
  );
}

function ImportRecordsPanel() {
  const {getValues} = useFormContext<AdminSettings>();
  const {data} = useSearchModels();
  const importModels = useImportSearchModels();
  const [selectedModel, setSelectedModel] = useState('*');
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Import Records" />}
      description={
        <Fragment>
          <p>
            <Trans message="After changing search method, database records need to be imported into the search index." />
          </p>
          <p className="mt-6">
            <Trans message="Depending on number of records in database, importing could take some time. Don't close this window while it is in progress." />
          </p>
        </Fragment>
      }
    >
      <Select
        size="sm"
        selectionMode="single"
        label={<Trans message="What to import?" />}
        selectedValue={selectedModel}
        onSelectionChange={newValue => {
          setSelectedModel(newValue as string);
        }}
      >
        <Item value="*">
          <Trans message="Everything" />
        </Item>
        {data?.models.map(item => (
          <Item value={item.model} key={item.model}>
            <Trans message={item.name} />
          </Item>
        ))}
      </Select>
      <Button
        size="sm"
        variant="flat"
        color="primary"
        className="mt-12"
        disabled={importModels.isPending}
        onClick={() => {
          importModels.mutate({
            model: selectedModel,
            driver: getValues('server.scout_driver')!,
          });
        }}
      >
        <Trans message="Import now" />
      </Button>
    </SettingsPanel>
  );
}
