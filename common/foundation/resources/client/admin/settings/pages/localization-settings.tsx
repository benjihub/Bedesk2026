import {AdminDocsUrls} from '@app/admin/admin-config';
import {AdminSettings} from '@common/admin/settings/admin-settings';
import {AdminSettingsLayout} from '@common/admin/settings/layout/settings-layout';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {useAdminSettings} from '@common/admin/settings/requests/use-admin-settings';
import {
  FetchValueListsResponse,
  valueListsQueryOptions,
} from '@common/http/value-lists';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Section} from '@ui/forms/listbox/section';
import {FormRadio} from '@ui/forms/radio-group/radio';
import {FormRadioGroup} from '@ui/forms/radio-group/radio-group';
import {FormSelect, Option} from '@ui/forms/select/select';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {DateFormatPresets, FormattedDate} from '@ui/i18n/formatted-date';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useCurrentDateTime} from '@ui/i18n/use-current-date-time';
import {useTrans} from '@ui/i18n/use-trans';
import {useForm} from 'react-hook-form';

export function Component() {
  const optionQuery = useSuspenseQuery(
    valueListsQueryOptions(['timezones', 'localizations']),
  );
  const timezones = optionQuery.data.timezones!;
  const localizations = optionQuery.data.localizations!;

  const {data} = useAdminSettings();

  const form = useForm<AdminSettings>({
    defaultValues: {
      client: {
        dates: {
          default_timezone: data.client.dates?.default_timezone ?? 'auto',
          format: data.client.dates?.format ?? 'auto',
        },
        locale: {
          default: data.client.locale?.default ?? 'auto',
        },
        i18n: {
          enable: data.client.i18n.enable ?? false,
        },
      },
    },
  });

  return (
    <AdminSettingsLayout
      title={<Trans message="Localization" />}
      form={form}
      docsLink={AdminDocsUrls.settings.localization}
    >
      <TimezoneSection timezones={timezones} />
      <LanguageSection localizations={localizations} />
      <DateFormatSection />
      <TranslationsSection />
    </AdminSettingsLayout>
  );
}

interface TimezoneSectionProps {
  timezones: NonNullable<FetchValueListsResponse['timezones']>;
}
function TimezoneSection({timezones}: TimezoneSectionProps) {
  const {trans} = useTrans();
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Default Timezone" />}
      description={
        <Trans message="Which timezone should be selected by default for new users and guests." />
      }
    >
      <FormSelect
        size="sm"
        required
        name="client.dates.default_timezone"
        label={<Trans message="Timezone" />}
        showSearchField
        selectionMode="single"
        searchPlaceholder={trans(message('Search timezones'))}
      >
        <Option key="auto" value="auto">
          <Trans message="Based on browser settings" />
        </Option>
        {Object.entries(timezones).map(([groupName, timezones]) => (
          <Section key={groupName} label={groupName}>
            {timezones.map((timezone: {value: string; text: string}) => (
              <Option key={timezone.value} value={timezone.value}>
                {timezone.text}
              </Option>
            ))}
          </Section>
        ))}
      </FormSelect>
    </SettingsPanel>
  );
}

interface LanguageSectionProps {
  localizations: NonNullable<FetchValueListsResponse['localizations']>;
}
function LanguageSection({localizations}: LanguageSectionProps) {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Default Language" />}
      description={
        <Trans message="Which localization should be selected by default for new users and guests." />
      }
    >
      <FormSelect
        size="sm"
        label={<Trans message="Language" />}
        name="client.locale.default"
        selectionMode="single"
      >
        <Option key="auto" value="auto">
          <Trans message="Based on browser settings" />
        </Option>
        {localizations.map(locale => (
          <Option key={locale.language} value={locale.language} capitalizeFirst>
            {locale.name}
          </Option>
        ))}
      </FormSelect>
    </SettingsPanel>
  );
}

function DateFormatSection() {
  const today = useCurrentDateTime();
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Date Format" />}
      description={
        <Trans message="Default verbosity for all dates displayed across the site. Month/day order and separators will be adjusted automatically, based on user's locale." />
      }
    >
      <FormRadioGroup
        required
        size="sm"
        name="client.dates.format"
        orientation="vertical"
      >
        <FormRadio key="auto" value="auto">
          <Trans message="Auto" />
        </FormRadio>
        {Object.entries(DateFormatPresets).map(([format, options]) => (
          <FormRadio key={format} value={format}>
            <FormattedDate date={today} options={options} />
          </FormRadio>
        ))}
      </FormRadioGroup>
    </SettingsPanel>
  );
}

function TranslationsSection() {
  return (
    <SettingsPanel
      className="mb-24"
      title={<Trans message="Translations" />}
      description={
        <Trans message="If disabled, site will always be shown in default language and user will not be able to change their locale." />
      }
    >
      <FormSwitch name="client.i18n.enable">
        <Trans message="Enable translations" />
      </FormSwitch>
    </SettingsPanel>
  );
}
