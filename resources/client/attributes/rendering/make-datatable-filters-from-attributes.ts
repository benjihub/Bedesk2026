import {CompactAttribute} from '@app/attributes/compact-attribute';
import {
  ALL_NUMBER_OPERATORS,
  ALL_STRING_OPERATORS,
  BackendFilter,
  FilterControlType,
  FilterOperator,
} from '@common/datatable/filters/backend-filter';
import {timestampFilter} from '@common/datatable/filters/timestamp-filters';
import {message} from '@ui/i18n/message';
import {getCountryList} from '@ui/utils/intl/countries';
import {getLanguageList} from '@ui/utils/intl/languages';
import {getTimeZoneList} from '@ui/utils/intl/timezones';

function getKey(attribute: CompactAttribute) {
  // custom attributes value is stored on main table
  if (attribute.materialized) {
    return attribute.key;
  }
  return `ca_${attribute.key}`;
}

export function makeDatatableFiltersFromAttributes(
  attributes: CompactAttribute[],
): BackendFilter[] {
  return attributes
    .map(attribute => {
      if (attribute.key === 'country') {
        const countries = getCountryList();
        return {
          key: 'country',
          label: message('Country'),
          defaultOperator: FilterOperator.eq,
          control: {
            type: FilterControlType.Select,
            showSearchField: true,
            options: countries.map(c => ({
              key: c.code,
              value: c.code,
              label: c.name,
            })),
          },
        };
      }

      if (attribute.key === 'timezone') {
        const timezones = getTimeZoneList();
        return {
          key: 'timezone',
          label: message('Timezone'),
          defaultOperator: FilterOperator.eq,
          operators: ALL_STRING_OPERATORS,
          control: {
            type: FilterControlType.Select,
            showSearchField: true,
            options: timezones.map(t => ({
              key: t,
              value: t,
              label: t,
            })),
          },
        };
      }

      if (attribute.key === 'language') {
        const languages = getLanguageList();
        return {
          key: 'language',
          label: message('Language'),
          defaultOperator: FilterOperator.eq,
          operators: ALL_STRING_OPERATORS,
          control: {
            type: FilterControlType.Select,
            showSearchField: true,
            options: languages.map(l => ({
              key: l.code,
              value: l.code,
              label: l.name,
            })),
          },
        };
      }

      switch (attribute.format) {
        case 'radioGroup':
        case 'dropdown':
        case 'checkboxGroup':
          return {
            key: getKey(attribute),
            label: message(attribute.name),
            description: attribute.description
              ? message(attribute.description)
              : null,
            defaultOperator: FilterOperator.eq,
            control: {
              type: FilterControlType.Select,
              defaultValue: attribute.config?.options?.[0]?.value,
              options: attribute.config?.options?.map(option => ({
                key: option.value,
                label: message(option.label),
                value: option.value,
              })),
            },
          };
        case 'switch':
          return {
            key: getKey(attribute),
            label: message(attribute.name),
            description: attribute.description
              ? message(attribute.description)
              : null,
            defaultOperator: FilterOperator.eq,
            control: {
              type: FilterControlType.Select,
              defaultValue: '01',
              options: [
                {
                  key: '01',
                  label: message('Yes'),
                  value: true,
                },
                {
                  key: '02',
                  label: message('No'),
                  value: false,
                },
              ],
            },
          };
        case 'number':
          return {
            key: getKey(attribute),
            label: message(attribute.name),
            description: attribute.description
              ? message(attribute.description)
              : null,
            defaultOperator: FilterOperator.gte,
            operators: ALL_NUMBER_OPERATORS,
            control: {
              type: FilterControlType.Input,
              inputType: 'number',
              defaultValue: 1,
            },
          };
        case 'text':
          return {
            key: getKey(attribute),
            label: message(attribute.name),
            description: attribute.description
              ? message(attribute.description)
              : null,
            defaultOperator: FilterOperator.gte,
            operators: ALL_STRING_OPERATORS,
            control: {
              type: FilterControlType.Input,
              defaultValue: '',
            },
          };
        case 'date':
          return timestampFilter({
            key: getKey(attribute),
            label: message(attribute.name),
            description: attribute.description
              ? message(attribute.description)
              : null,
          });
      }
    })
    .filter((f): f is BackendFilter<any> => f != null);
}
