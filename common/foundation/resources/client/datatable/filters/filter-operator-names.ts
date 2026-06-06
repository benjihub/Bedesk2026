import {message} from '@ui/i18n/message';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {FilterOperator} from './backend-filter';

export const FilterOperatorNames: {[op in FilterOperator]: MessageDescriptor} =
  {
    '=': message('is'),
    '!=': message('is not'),
    '>': message('is greater than'),
    '>=': message('is greater than or equal to'),
    '<': message('is less than'),
    '<=': message('is less than or equal to'),
    notNull: message('is not empty'),
    contains: message('contains'),
    notContains: message('does not contain'),
    startsWith: message('starts with'),
    endsWith: message('ends with'),
    has: message('Include'),
    doesntHave: message('Do not include'),
    between: message('Is between'),
    hasAll: message('Include all'),
  };
