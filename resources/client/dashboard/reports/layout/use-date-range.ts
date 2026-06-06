import {DateRangeValue} from '@ui/forms/input-field/date/date-range-picker/date-range-value';
import {DateRangePresets} from '@ui/forms/input-field/date/date-range-picker/dialog/date-range-presets';
import {useState} from 'react';

export function useReportDateRange() {
  return useState<DateRangeValue>(() => DateRangePresets[4].getRangeValue());
}
