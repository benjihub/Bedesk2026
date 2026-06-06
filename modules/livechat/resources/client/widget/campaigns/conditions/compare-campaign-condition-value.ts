import {FilterOperator} from '@common/datatable/filters/backend-filter';

export function compareCampaignConditionValue(
  operator: FilterOperator,
  haystack: any,
  needle: any,
): boolean {
  switch (operator) {
    case FilterOperator.eq:
      return haystack === needle;
    case FilterOperator.ne:
      return haystack !== needle;
    case FilterOperator.contains:
      return stringIncludes(haystack, needle);
    case FilterOperator.notContains:
      return !stringIncludes(haystack, needle);
    case FilterOperator.gt:
      return haystack > needle;
    case FilterOperator.lt:
      return haystack < needle;
    default:
      return false;
  }
}

function stringIncludes(haystack: unknown, needle: unknown): boolean {
  if (typeof haystack !== 'string' || typeof needle !== 'string') {
    return false;
  }
  return haystack.toLowerCase().includes(needle.toLowerCase());
}
