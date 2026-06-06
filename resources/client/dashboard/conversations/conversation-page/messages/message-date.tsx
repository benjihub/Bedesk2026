import {isSameYear, isToday, parseAbsolute} from '@internationalized/date';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {useCurrentDateTime} from '@ui/i18n/use-current-date-time';
import {useUserTimezone} from '@ui/i18n/use-user-timezone';
import {shallowEqual} from '@ui/utils/shallow-equal';
import {Fragment, memo} from 'react';

const sameDayFormat: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
};

const sameYearFormat: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};

const differentYearFormat: Intl.DateTimeFormatOptions = {
  ...sameYearFormat,
  year: 'numeric',
};

interface Props {
  date: string;
}

export const MessageDate = memo(({date}: Props) => {
  const userTimezone = useUserTimezone();
  const now = useCurrentDateTime();

  if (!date) return null;

  try {
    const parsedDate = parseAbsolute(date, userTimezone);

    // same hour, show relative time: 5 min ago
    if (parsedDate.hour === now.hour) {
      return <FormattedRelativeTime date={date} style="narrow" />;
    }

    if (isToday(parsedDate, userTimezone)) {
      // if it's today, show only time: 10:30
      return <FormattedDate date={date} options={sameDayFormat} />;
    } else if (isSameYear(parsedDate, now)) {
      // same year, but different day: Apr 10, 10:30
      return (
        <Fragment>
          <FormattedDate date={date} options={sameYearFormat} />
        </Fragment>
      );
    } else {
      // different year: Apr 10, 2025 10:30
      return (
        <Fragment>
          <FormattedDate date={date} options={differentYearFormat} />
        </Fragment>
      );
    }
  } catch (e) {
    return <Trans message="Invalid date" />;
  }
}, shallowEqual);
