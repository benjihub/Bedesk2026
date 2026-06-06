import {commonAdminQueries} from '@common/admin/common-admin-queries';
import {useSuspenseQuery} from '@tanstack/react-query';
import {AdminSettings} from '../admin-settings';

export interface FetchAdminSettingsResponse extends AdminSettings {}

export function useAdminSettings() {
  return useSuspenseQuery({
    ...commonAdminQueries.settings.index,
    select: prepareSettingsForHookForm,
  });
}

// need to cast all numbers to strings and null/undefined to empty string recursively, otherwise hook form isDirty functionality will not work properly when binding numbers to text fields due to string/number type mismatch
export function prepareSettingsForHookForm(
  obj: any,
): FetchAdminSettingsResponse {
  for (const key in obj) {
    if (key === 'themes' || key === 'defaults') {
      continue;
    } else if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map(prepareSettingsForHookForm);
    } else if (typeof obj[key] === 'object') {
      obj[key] = prepareSettingsForHookForm(obj[key]);
    } else if (typeof obj[key] === 'number') {
      obj[key] = obj[key].toString();
    } else if (obj[key] == null) {
      obj[key] = '';
    }
  }
  return obj;
}
