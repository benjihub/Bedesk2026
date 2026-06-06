import {Item} from '@ui/forms/listbox/item';
import {Section} from '@ui/forms/listbox/section';
import {Select, SelectProps} from '@ui/forms/select/select';
import {getCountryList} from '@ui/utils/intl/countries';
import {getLanguageList} from '@ui/utils/intl/languages';
import {getTimeZoneGroups} from '@ui/utils/intl/timezones';

export const technologyAndLocaleSelects = [
  'country',
  'browser',
  'platform',
  'device',
  'language',
  'timezone',
] as const;

export type TechnologyOrLocaleSelectType =
  (typeof technologyAndLocaleSelects)[number];

type Props = Omit<SelectProps<any>, 'children' | 'onChange' | 'value'> & {
  type: TechnologyOrLocaleSelectType;
  value: string | number;
  onChange: (value: string) => void;
};
export function TechnologyOrLocaleSelect({type, ...props}: Props) {
  switch (type) {
    case 'country':
      return <CountrySelect {...props} />;
    case 'browser':
      return <BrowserSelect {...props} />;
    case 'platform':
      return <PlatformSelect {...props} />;
    case 'device':
      return <DeviceSelect {...props} />;
    case 'language':
      return <LanguageSelect {...props} />;
    case 'timezone':
      return <TimezoneSelect {...props} />;
  }
}

function CountrySelect({value, onChange, ...selectProps}: Omit<Props, 'type'>) {
  const countries = getCountryList();
  return (
    <Select
      {...selectProps}
      selectionMode="single"
      selectedValue={value}
      onSelectionChange={value => onChange(value as string)}
      showSearchField
    >
      {countries.map(country => (
        <Item key={country.code} value={country.code}>
          {country.name}
        </Item>
      ))}
    </Select>
  );
}

function LanguageSelect({
  value,
  onChange,
  ...selectProps
}: Omit<Props, 'type'>) {
  const languages = getLanguageList();
  return (
    <Select
      {...selectProps}
      selectionMode="single"
      selectedValue={value}
      onSelectionChange={value => onChange(value as string)}
      showSearchField
    >
      {languages.map(language => (
        <Item key={language.code} value={language.code}>
          {language.name}
        </Item>
      ))}
    </Select>
  );
}

function TimezoneSelect({
  value,
  onChange,
  ...selectProps
}: Omit<Props, 'type'>) {
  const timezones = getTimeZoneGroups();
  return (
    <Select
      {...selectProps}
      selectionMode="single"
      selectedValue={value}
      onSelectionChange={value => onChange(value as string)}
      showSearchField
    >
      {Object.entries(timezones).map(([sectionName, sectionItems]) => (
        <Section label={sectionName} key={sectionName}>
          {sectionItems.map(timezone => (
            <Item key={timezone} value={timezone}>
              {timezone}
            </Item>
          ))}
        </Section>
      ))}
    </Select>
  );
}

function BrowserSelect({value, onChange, ...selectProps}: Omit<Props, 'type'>) {
  return (
    <Select
      {...selectProps}
      selectionMode="single"
      selectedValue={value}
      onSelectionChange={value => onChange(value as string)}
    >
      <Item value="chrome">Chrome</Item>
      <Item value="safari">Safari</Item>
      <Item value="edge">Edge</Item>
      <Item value="firefox">Firefox</Item>
    </Select>
  );
}

function PlatformSelect({
  value,
  onChange,
  ...selectProps
}: Omit<Props, 'type'>) {
  return (
    <Select
      {...selectProps}
      selectionMode="single"
      selectedValue={value}
      onSelectionChange={value => onChange(value as string)}
    >
      <Item value="windows">Windows</Item>
      <Item value="os x">OS X</Item>
      <Item value="ios">iOS</Item>
      <Item value="android">Android</Item>
      <Item value="linux">Linux</Item>
    </Select>
  );
}

function DeviceSelect({value, onChange, ...selectProps}: Omit<Props, 'type'>) {
  return (
    <Select
      {...selectProps}
      selectionMode="single"
      selectedValue={value}
      onSelectionChange={value => onChange(value as string)}
    >
      <Item value="desktop">Desktop</Item>
      <Item value="mobile">Mobile</Item>
      <Item value="tablet">Tablet</Item>
    </Select>
  );
}
