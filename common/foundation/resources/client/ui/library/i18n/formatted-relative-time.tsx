import {DateValue, parseAbsoluteToLocal} from '@internationalized/date';
import {useSelectedLocale} from '@ui/i18n/selected-locale';
import {Trans} from '@ui/i18n/trans';
import {useNumberFormatter} from '@ui/i18n/use-number-formatter';
import {useUserTimezone} from '@ui/i18n/use-user-timezone';
import {shallowEqual} from '@ui/utils/shallow-equal';
import {Fragment, memo, useMemo} from 'react';

const DIVISIONS: {amount: number; name: Intl.RelativeTimeFormatUnit}[] = [
  {amount: 60, name: 'second'},
  {amount: 60, name: 'minute'},
  {amount: 24, name: 'hour'},
  {amount: 7, name: 'day'},
  {amount: 4.34524, name: 'week'},
  {amount: 12, name: 'month'},
  {amount: Number.POSITIVE_INFINITY, name: 'year'},
];

interface FormattedDateProps {
  date?: string | DateValue | Date | null;
  style?: Intl.RelativeTimeFormatStyle;
  variant?: 'default' | 'noText';
}
export const FormattedRelativeTime = memo(
  ({date, style, variant = 'default'}: FormattedDateProps) => {
    const {localeCode} = useSelectedLocale();
    const timezone = useUserTimezone();

    if (!date) return null;

    // make sure date with invalid format does not blow up the app
    try {
      if (typeof date === 'string') {
        // ISO-8601 string expected; parse to local Date
        date = parseAbsoluteToLocal(date).toDate();
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

    const {unit, duration} = getUnitAndDuration(date);

    if (unit === 'second') {
      return style === 'narrow' ? (
        <Trans message="Now" />
      ) : (
        <Trans message="Just now" />
      );
    }

    if (variant === 'noText') {
      return <FormattedNumber duration={duration} unit={unit} style={style} />;
    }

    return <FormattedDate duration={duration} unit={unit} style={style} />;
  },
  shallowEqual,
);

interface FormatterProps {
  duration: number;
  unit: Intl.RelativeTimeFormatUnit;
  style?: Intl.RelativeTimeFormatStyle;
}
function FormattedNumber({duration, unit, style}: FormatterProps) {
  const formatter = useNumberFormatter({
    style: 'unit',
    unit,
    unitDisplay: style,
  });

  return (
    <Fragment>{formatter.format(Math.abs(Math.round(duration)))}</Fragment>
  );
}

function FormattedDate({duration, unit, style}: FormatterProps) {
  const {localeCode} = useSelectedLocale();
  const formatter = useMemo(
    () =>
      new Intl.RelativeTimeFormat(localeCode, {
        numeric: 'auto',
        style,
      }),

    [localeCode, style],
  );

  return <Fragment>{formatter.format(Math.round(duration), unit)}</Fragment>;
}

function getUnitAndDuration(date: Date): {
  unit: Intl.RelativeTimeFormatUnit;
  duration: number;
} {
  let duration = (date.getTime() - Date.now()) / 1000;
  for (let i = 0; i <= DIVISIONS.length; i++) {
    const division = DIVISIONS[i];
    if (Math.abs(duration) < division.amount) {
      return {unit: division.name, duration};
    }
    duration /= division.amount;
  }
  return {unit: 'day', duration};
}
