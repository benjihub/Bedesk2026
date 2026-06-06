import {DateValue, parseAbsolute} from '@internationalized/date';
import {Fragment, memo} from 'react';
import {useDateFormatter} from '@ui/i18n/use-date-formatter';
import {shallowEqual} from '@ui/utils/shallow-equal';
import {useSettings} from '@ui/settings/use-settings';
import {useUserTimezone} from '@ui/i18n/use-user-timezone';

export const DateFormatPresets: Record<
  'numeric' | 'short' | 'long' | 'timestamp' | 'time',
  Intl.DateTimeFormatOptions
> = {
  numeric: {year: 'numeric', month: '2-digit', day: '2-digit'},
  short: {year: 'numeric', month: 'short', day: '2-digit'},
  long: {month: 'long', day: '2-digit', year: 'numeric'},
  timestamp: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  },
  time: {
    hour: '2-digit',
    minute: '2-digit',
  },
};

interface FormattedDateProps {
  date?: string | DateValue | Date;
  options?: Intl.DateTimeFormatOptions;
  preset?: keyof typeof DateFormatPresets;
  timezone?: string;
}

export const FormattedDate = memo(
  ({date, options, preset, timezone: propsTimezone}: FormattedDateProps) => {
    const {dates} = useSettings();
    const userTimezone = useUserTimezone();
    const timezone = propsTimezone || options?.timeZone || userTimezone;

    const formatterOptions: Intl.DateTimeFormatOptions =
      options ||
      (DateFormatPresets as Record<string, Intl.DateTimeFormatOptions>)[
        preset || dates?.format || 'short'
      ] ||
      {};

    if (!formatterOptions.timeZone) {
      formatterOptions.timeZone = timezone;
    }

    const formatter = useDateFormatter(formatterOptions);

    if (!date) {
      return null;
    }

    // make sure date with invalid format does not blow up the app
    try {
      if (typeof date === 'string') {
        // Expect ISO-8601 string; parse to Date in target timezone
        date = parseAbsolute(date, timezone).toDate();
      } else if (typeof date === 'number') {
        // Accept both epoch seconds and milliseconds
        const ms = date < 1e12 ? date * 1000 : date;
        date = new Date(ms);
      } else if ('toDate' in date) {
        date = date.toDate(timezone);
      }
    } catch (e) {
      return null;
    }

    return <Fragment>{formatter.format(date as Date)}</Fragment>;
  },
  shallowEqual,
);
