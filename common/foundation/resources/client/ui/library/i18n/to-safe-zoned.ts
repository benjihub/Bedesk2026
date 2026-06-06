import {
  CalendarDate,
  CalendarDateTime,
  Disambiguation,
  toZoned,
  ZonedDateTime,
} from '@internationalized/date';

export function toSafeZoned(
  date: CalendarDate | CalendarDateTime | ZonedDateTime,
  timeZone: string,
  disambiguation?: Disambiguation,
): ZonedDateTime {
  try {
    return toZoned(date, timeZone, disambiguation);
  } catch (e) {
    return toZoned(date, 'UTC', disambiguation);
  }
}
