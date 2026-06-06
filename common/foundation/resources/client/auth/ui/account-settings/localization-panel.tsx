import {AccountSettingsPanel} from '@common/auth/ui/account-settings/account-settings-panel';
import {AccountSettingsId} from '@common/auth/ui/account-settings/account-settings-sidenav';
import {useUpdateAccountDetails} from '@common/auth/ui/account-settings/basic-info-panel/update-account-details';
import {TimezoneSelect} from '@common/auth/ui/account-settings/timezone-select';
import {useChangeLocale} from '@common/locale-switcher/change-locale';
import {useBootstrapDataStore} from '@ui/bootstrap-data/bootstrap-data-store';
import {Button} from '@ui/buttons/button';
import {Form} from '@ui/forms/form';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {User} from '@ui/types/user';
import {getCountryList} from '@ui/utils/intl/countries';
import {getTimeZoneGroups} from '@ui/utils/intl/timezones';
import {useId} from 'react';
import {useForm} from 'react-hook-form';

interface PartialUser {
  id: number;
  language?: User['language'];
  country?: User['country'];
  timezone?: User['timezone'];
}

interface Props {
  user: PartialUser;
}
export function LocalizationPanel({user}: Props) {
  const locales = useBootstrapDataStore(s => s.data.i18n.locales);
  const formId = useId();
  const {trans} = useTrans();
  const form = useForm<Partial<User>>({
    defaultValues: {
      language: user.language || '',
      country: user.country || '',
      timezone: user.timezone || 'UTC',
    },
  });
  const updateDetails = useUpdateAccountDetails(user.id, form);
  const changeLocale = useChangeLocale();

  const countries = getCountryList();
  const timezones = getTimeZoneGroups();

  return (
    <AccountSettingsPanel
      id={AccountSettingsId.LocationAndLanguage}
      title={<Trans message="Date, time and language" />}
      actions={
        <Button
          type="submit"
          variant="flat"
          color="primary"
          form={formId}
          disabled={updateDetails.isPending || !form.formState.isValid}
        >
          <Trans message="Save" />
        </Button>
      }
    >
      <Form
        form={form}
        onSubmit={newDetails => {
          updateDetails.mutate(newDetails);
          changeLocale.mutate({locale: newDetails.language});
        }}
        id={formId}
      >
        <FormSelect
          className="mb-24"
          selectionMode="single"
          name="language"
          label={<Trans message="Language" />}
        >
          {locales.map(localization => (
            <Item key={localization.language} value={localization.language}>
              {localization.name}
            </Item>
          ))}
        </FormSelect>
        <FormSelect
          className="mb-24"
          selectionMode="single"
          name="country"
          label={<Trans message="Country" />}
          showSearchField
          searchPlaceholder={trans(message('Search countries'))}
        >
          {countries.map(country => (
            <Item key={country.code} value={country.code}>
              {country.name}
            </Item>
          ))}
        </FormSelect>
        <TimezoneSelect
          label={<Trans message="Timezone" />}
          name="timezone"
          timezones={timezones}
        />
      </Form>
    </AccountSettingsPanel>
  );
}
