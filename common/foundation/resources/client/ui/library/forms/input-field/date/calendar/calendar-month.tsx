import {
  CalendarDate,
  endOfMonth,
  getWeeksInMonth,
  startOfMonth,
  startOfWeek,
} from '@internationalized/date';
import {IconButton} from '@ui/buttons/icon-button';
import {useSelectedLocale} from '@ui/i18n/selected-locale';
import {useDateFormatter} from '@ui/i18n/use-date-formatter';
import {KeyboardArrowLeftIcon} from '@ui/icons/material/KeyboardArrowLeft';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import clsx from 'clsx';
import {m} from 'framer-motion';
import {DatePickerState} from '../date-picker/use-date-picker-state';
import {DateRangePickerState} from '../date-range-picker/use-date-range-picker-state';
import {dateIsInvalid} from '../utils';
import {CalendarCell} from './calendar-cell';

export interface CalendarMonthProps {
  state: DatePickerState | DateRangePickerState;
  startDate: CalendarDate;
  isFirst: boolean;
  isLast: boolean;
}
export function CalendarMonth({
  startDate,
  state,
  isFirst,
  isLast,
}: CalendarMonthProps) {
  const {localeCode} = useSelectedLocale();
  const weeksInMonth = getWeeksInMonth(startDate, localeCode);
  const monthStart = startOfWeek(startDate, localeCode);

  return (
    <div className="w-280 flex-shrink-0">
      <CalendarMonthHeader
        isFirst={isFirst}
        isLast={isLast}
        state={state}
        currentMonth={startDate}
      />
      <div className="block" role="grid">
        <WeekdayHeader state={state} startDate={startDate} />
        {[...new Array(weeksInMonth).keys()].map(weekIndex => (
          <m.div className="mb-6 flex" key={weekIndex}>
            {[...new Array(7).keys()].map(dayIndex => (
              <CalendarCell
                key={dayIndex}
                date={monthStart.add({weeks: weekIndex, days: dayIndex})}
                currentMonth={startDate}
                state={state}
              />
            ))}
          </m.div>
        ))}
      </div>
    </div>
  );
}

interface CalendarMonthHeaderProps {
  state: DatePickerState | DateRangePickerState;
  currentMonth: CalendarDate;
  isFirst: boolean;
  isLast: boolean;
}
function CalendarMonthHeader({
  currentMonth,
  isFirst,
  isLast,
  state: {calendarDates, setCalendarDates, timezone, min, max},
}: CalendarMonthHeaderProps) {
  const shiftCalendars = (direction: 'forward' | 'backward') => {
    const count = calendarDates.length;
    let newDates: CalendarDate[];
    if (direction === 'forward') {
      newDates = calendarDates.map(date =>
        endOfMonth(date.add({months: count})),
      );
    } else {
      newDates = calendarDates.map(date =>
        endOfMonth(date.subtract({months: count})),
      );
    }
    setCalendarDates(newDates);
  };

  const monthFormatter = useDateFormatter({
    month: 'long',
    year: 'numeric',
    era: currentMonth.calendar.identifier !== 'gregory' ? 'long' : undefined,
    calendar: currentMonth.calendar.identifier,
  });

  const isBackwardDisabled = dateIsInvalid(
    currentMonth.subtract({days: 1}),
    min,
    max,
  );
  const isForwardDisabled = dateIsInvalid(
    startOfMonth(currentMonth.add({months: 1})),
    min,
    max,
  );

  return (
    <div className="flex items-center justify-between gap-10">
      <IconButton
        size="md"
        className={clsx('text-muted', !isFirst && 'invisible')}
        disabled={!isFirst || isBackwardDisabled}
        aria-hidden={!isFirst}
        onClick={() => {
          shiftCalendars('backward');
        }}
      >
        <KeyboardArrowLeftIcon />
      </IconButton>
      <div className="select-none text-sm font-semibold">
        {monthFormatter.format(currentMonth.toDate(timezone))}
      </div>
      <IconButton
        size="md"
        className={clsx('text-muted', !isLast && 'invisible')}
        disabled={!isLast || isForwardDisabled}
        aria-hidden={!isLast}
        onClick={() => {
          shiftCalendars('forward');
        }}
      >
        <KeyboardArrowRightIcon />
      </IconButton>
    </div>
  );
}

interface WeekdayHeaderProps {
  state: DatePickerState | DateRangePickerState;
  startDate: CalendarDate;
}
function WeekdayHeader({state: {timezone}, startDate}: WeekdayHeaderProps) {
  const {localeCode} = useSelectedLocale();
  const dayFormatter = useDateFormatter({weekday: 'short'});

  const monthStart = startOfWeek(startDate, localeCode);

  return (
    <div className="flex">
      {[...new Array(7).keys()].map(index => {
        const date = monthStart.add({days: index});
        const dateDay = date.toDate(timezone);
        const weekday = dayFormatter.format(dateDay);
        return (
          <div
            className="relative h-40 w-40 flex-shrink-0 text-sm font-semibold"
            key={index}
          >
            <div className="absolute flex h-full w-full select-none items-center justify-center">
              {weekday}
            </div>
          </div>
        );
      })}
    </div>
  );
}
