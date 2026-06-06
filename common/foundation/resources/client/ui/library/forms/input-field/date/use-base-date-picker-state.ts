import {useState} from 'react';
import {DateValue, ZonedDateTime} from '@internationalized/date';
import {getDefaultGranularity} from './utils';
import type {DatePickerValueProps} from './date-picker/use-date-picker-state';
import {DateRangeValue} from './date-range-picker/date-range-value';
import {useUserTimezone} from '@ui/i18n/use-user-timezone';
import {toSafeZoned} from '@ui/i18n/to-safe-zoned';

export function useBaseDatePickerState(
  selectedDate: DateValue,
  props:
    | DatePickerValueProps<ZonedDateTime>
    | DatePickerValueProps<Partial<DateRangeValue>, DateRangeValue>,
) {
  const userTimezone = useUserTimezone();
  const timezone = props.timezone ?? userTimezone;
  const [calendarIsOpen, setCalendarIsOpen] = useState(false);
  const closeDialogOnSelection = props.closeDialogOnSelection ?? true;

  const granularity = props.granularity || getDefaultGranularity(selectedDate);
  const min = props.min ? toSafeZoned(props.min, timezone) : undefined;
  const max = props.max ? toSafeZoned(props.max, timezone) : undefined;

  return {
    timezone,
    granularity,
    min,
    max,
    calendarIsOpen,
    setCalendarIsOpen,
    closeDialogOnSelection,
  };
}
