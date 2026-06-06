import {makeDatatableFiltersFromAttributes} from '@app/attributes/rendering/make-datatable-filters-from-attributes';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {
  ALL_NUMBER_OPERATORS,
  ALL_STRING_OPERATORS,
  BackendFilter,
  FilterControlType,
  FilterOperator,
} from '@common/datatable/filters/backend-filter';
import {createdAtFilter} from '@common/datatable/filters/timestamp-filters';
import {useQuery} from '@tanstack/react-query';
import {message} from '@ui/i18n/message';
import {useMemo} from 'react';

export function useCustomersDatatableFilters(): BackendFilter[] {
  const fieldsQuery = useQuery(
    helpdeskQueries.attributes.normalizedList({
      type: 'user',
      for: 'agent',
    }),
  );
  const fields = fieldsQuery.data?.attributes;
  return useMemo(() => {
    if (!fields) return [];
    return [
      {
        key: 'is_returning',
        label: message('Returning visitor'),
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.BooleanToggle,
          defaultValue: true,
        },
      },
      {
        key: 'page_visits_count',
        label: message('Number of visits'),
        defaultOperator: FilterOperator.gte,
        operators: ALL_NUMBER_OPERATORS,
        control: {
          type: FilterControlType.Input,
          inputType: 'number',
          defaultValue: 5,
        },
      },
      createdAtFilter({
        description: message('First visit date'),
      }),
      {
        key: 'browser',
        label: message('Browser'),
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.Select,
          defaultValue: 'chrome',
          options: [
            {key: 'chrome', value: 'chrome', label: 'Chrome'},
            {key: 'firefox', value: 'firefox', label: 'Firefox'},
            {key: 'safari', value: 'safari', label: 'Safari'},
            {key: 'edge', value: 'edge', label: 'Edge'},
          ],
        },
      },
      {
        key: 'device',
        label: message('Device'),
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.Select,
          defaultValue: 'desktop',
          options: [
            {key: 'desktop', value: 'desktop', label: message('Desktop')},
            {key: 'phone', value: 'phone', label: message('Phone')},
            {key: 'tablet', value: 'tablet', label: message('Tablet')},
          ],
        },
      },
      {
        key: 'platform',
        label: message('Platform'),
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.Select,
          defaultValue: 'windows',
          options: [
            {key: 'windows', value: 'windows', label: message('Windows')},
            {key: 'OS X', value: 'OS X', label: message('Mac')},
            {key: 'linux', value: 'linux', label: message('Linux')},
          ],
        },
      },
      ...makeDatatableFiltersFromAttributes(fields).filter(
        f => f.key !== 'name' && f.key !== 'email',
      ),
      {
        key: 'city',
        label: message('City'),
        defaultOperator: FilterOperator.eq,
        operators: ALL_STRING_OPERATORS,
        control: {
          type: FilterControlType.Input,
          inputType: 'string',
          defaultValue: '',
        },
      },
      {
        key: 'ip_address',
        label: message('IP address'),
        defaultOperator: FilterOperator.eq,
        control: {
          type: FilterControlType.Input,
          inputType: 'string',
          defaultValue: '',
        },
      },
    ];
  }, [fields]);
}
