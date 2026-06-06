import {getLocalTimeZone} from '@internationalized/date';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';

export function getUserTimezone(): string {
  const defaultTimezone = getBootstrapData()?.settings.dates?.default_timezone;
  const preferredTimezone =
    getBootstrapData()?.user?.timezone || defaultTimezone || 'auto';

  if (!preferredTimezone || preferredTimezone === 'auto') {
    return getLocalTimeZone();
  }
  return preferredTimezone;
}
