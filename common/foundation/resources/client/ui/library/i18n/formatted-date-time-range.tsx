import {DateValue, parseAbsolute} from '@internationalized/date';
import {DateFormatPresets} from '@ui/i18n/formatted-date';
import {useDateFormatter} from '@ui/i18n/use-date-formatter';
import {useUserTimezone} from '@ui/i18n/use-user-timezone';
import {useSettings} from '@ui/settings/use-settings';
import {shallowEqual} from '@ui/utils/shallow-equal';
import {Fragment, memo} from 'react';

interface FormattedDateTimeRangeProps {
  start?: string | DateValue | Date;
  end?: string | DateValue | Date;
  options?: Intl.DateTimeFormatOptions;
  preset?: keyof typeof DateFormatPresets;
  timezone?: string;
}
export const FormattedDateTimeRange = memo(
  ({
    start,
    end,
    options,
    preset,
    timezone: propsTimezone,
  }: FormattedDateTimeRangeProps) => {
    const {dates} = useSettings();
    const userTimezone = useUserTimezone();
    const timezone = propsTimezone || options?.timeZone || userTimezone;
    const formatter = useDateFormatter(
      options ||
        (DateFormatPresets as Record<string, Intl.DateTimeFormatOptions>)[
          preset || dates?.format || 'short'
        ],
    );

    if (!start || !end) {
      return null;
    }

    let value: string;

    try {
      value = formatter.formatRange(
        castToDate(start, timezone),
        castToDate(end, timezone),
      );
    } catch (e) {
      value = '';
    }

    return <Fragment>{value}</Fragment>;
  },
  shallowEqual,
);

function castToDate(date: string | DateValue | Date, timezone: string): Date {
  if (typeof date === 'string') {
    return parseAbsolute(date, timezone).toDate();
  }
  if ('toDate' in date) {
    return date.toDate(timezone);
  }
  return date;
}
