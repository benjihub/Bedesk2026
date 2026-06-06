import {
  BackendFilter,
  FilterControlType,
  FilterOperator,
} from '@common/datatable/filters/backend-filter';
import {
  createdAtFilter,
  updatedAtFilter,
} from '@common/datatable/filters/timestamp-filters';
import {message} from '@ui/i18n/message';

export const AttributesDatatableFilters: BackendFilter[] = [
  {
    key: 'type',
    label: message('Type'),
    description: message('Type of the attribute'),
    defaultOperator: FilterOperator.eq,
    control: {
      type: FilterControlType.Select,
      defaultValue: '01',
      options: [
        {
          key: '01',
          label: message('Conversation'),
          value: 'conversation',
        },
        {
          key: '02',
          label: message('User'),
          value: 'user',
        },
        {
          key: '03',
          label: message('Other'),
          value: 'custom',
        },
      ],
    },
  },
  {
    key: 'permission',
    label: message('Permission'),
    description: message('Who can view and edit this attribute'),
    defaultOperator: FilterOperator.eq,
    control: {
      type: FilterControlType.Select,
      defaultValue: '01',
      options: [
        {
          key: '01',
          label: message('Only agents'),
          value: 'agentOnly',
        },
        {
          key: '02',
          label: message('User can edit'),
          value: 'userCanEdit',
        },
        {
          key: '03',
          label: message('User can view'),
          value: 'userCanView',
        },
      ],
    },
  },
  {
    key: 'active',
    label: message('Status'),
    description: message('Whether attribute is active or not'),
    defaultOperator: FilterOperator.eq,
    control: {
      type: FilterControlType.Select,
      defaultValue: '01',
      options: [
        {
          key: '01',
          label: message('Active'),
          value: true,
        },
        {
          key: '02',
          label: message('Inactive'),
          value: false,
        },
      ],
    },
  },
  {
    key: 'required',
    label: message('Required'),
    description: message('Show only required attributes'),
    defaultOperator: FilterOperator.eq,
    control: {
      type: FilterControlType.BooleanToggle,
      defaultValue: true,
    },
  },
  createdAtFilter({
    description: message('Date attribute was created'),
  }),
  updatedAtFilter({
    description: message('Date attribute was last updated'),
  }),
];
