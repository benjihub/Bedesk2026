import {getLocalTimeZone} from '@internationalized/date';
import {useBootstrapDataStore} from '@ui/bootstrap-data/bootstrap-data-store';
import {useMemo} from 'react';

export function useUserTimezone(): string {
  const {user, settings} = useBootstrapDataStore(s => s.data);
  const defaultTimezone = settings.dates?.default_timezone;
  const preferredTimezone = user?.timezone || defaultTimezone || 'auto';

  return useMemo(() => {
    return !preferredTimezone || preferredTimezone === 'auto'
      ? getLocalTimeZone()
      : preferredTimezone;
  }, [preferredTimezone]);
}
