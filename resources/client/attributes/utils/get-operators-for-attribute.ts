import {CompactAttribute} from '@app/attributes/compact-attribute';
import {
  ALL_NUMBER_OPERATORS,
  ALL_STRING_OPERATORS,
  FilterOperator,
} from '@common/datatable/filters/backend-filter';

export function getOperatorsForAttribute(attribute: CompactAttribute) {
  switch (attribute.format) {
    case 'number':
      return ALL_NUMBER_OPERATORS;
    case 'date':
      return [
        FilterOperator.eq,
        FilterOperator.ne,
        FilterOperator.gt,
        FilterOperator.gte,
        FilterOperator.lt,
        FilterOperator.lte,
      ];
    case 'radioGroup':
    case 'checkboxGroup':
      return [FilterOperator.contains, FilterOperator.notContains];
    case 'text':
    case 'multiLineText':
    case 'email':
    case 'phone':
      return ALL_STRING_OPERATORS;
    case 'dropdown':
    case 'rating':
    case 'switch':
      return [FilterOperator.eq];
  }
}
