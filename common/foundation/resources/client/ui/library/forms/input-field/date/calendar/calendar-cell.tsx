import React from 'react';
import clsx from 'clsx';
import {
  CalendarDate,
  DateValue,
  getDayOfWeek,
  isSameMonth,
  isToday,
} from '@internationalized/date';
import {useSelectedLocale} from '@ui/i18n/selected-locale';
import {DatePickerState} from '../date-picker/use-date-picker-state';
import {dateIsInvalid} from '../utils';
import {DateRangePickerState} from '../date-range-picker/use-date-range-picker-state';

interface CalendarCellProps {
  date: CalendarDate;
  currentMonth: DateValue;
  state: DatePickerState | DateRangePickerState;
}
export function CalendarCell({
  date,
  currentMonth,
  state: {
    dayIsActive,
    dayIsHighlighted,
    dayIsRangeStart,
    dayIsRangeEnd,
    getCellProps,
    timezone,
    min,
    max,
  },
}: CalendarCellProps) {
  const {localeCode} = useSelectedLocale();
  const dayOfWeek = getDayOfWeek(date, localeCode);
  const isActive = dayIsActive(date);
  const isHighlighted = dayIsHighlighted(date);
  const isRangeStart = dayIsRangeStart(date);
  const isRangeEnd = dayIsRangeEnd(date);
  const dayIsToday = isToday(date, timezone);
  const sameMonth = isSameMonth(date, currentMonth);
  const isDisabled = dateIsInvalid(date, min, max);

  return (
    <div
      role="button"
      aria-disabled={isDisabled}
      className={clsx(
        'relative isolate h-40 w-40 flex-shrink-0 text-sm',
        isDisabled && 'pointer-events-none text-disabled',
        !sameMonth && 'pointer-events-none invisible',
      )}
      {...getCellProps(date, sameMonth)}
    >
      <span
        className={clsx(
          'absolute inset-0 z-10 flex h-full w-full cursor-pointer select-none items-center justify-center rounded-full',
          !isActive && !dayIsToday && 'hover:bg-hover',
          isActive && 'bg-primary font-semibold text-on-primary',
          dayIsToday && !isActive && 'bg-chip',
        )}
      >
        {date.day}
      </span>
      {isHighlighted && sameMonth && (
        <span
          className={clsx(
            'absolute inset-0 h-full w-full bg-primary/focus',
            (isRangeStart || dayOfWeek === 0 || date.day === 1) &&
              'rounded-l-full',
            (isRangeEnd ||
              dayOfWeek === 6 ||
              date.day ===
                currentMonth.calendar.getDaysInMonth(currentMonth)) &&
              'rounded-r-full',
          )}
        />
      )}
    </div>
  );
}
