import memoize from 'nano-memoize';

export const getTimeZoneList = memoize(() =>
  Intl.supportedValuesOf('timeZone'),
);

export const getTimeZoneGroups = memoize(() => {
  const timezones = getTimeZoneList();
  const groups: Record<string, string[]> = {};
  for (const timezone of timezones) {
    const [region, city] = timezone.split('/');
    if (!groups[region]) {
      groups[region] = [];
    }
    groups[region].push(timezone);
  }
  return groups;
});
