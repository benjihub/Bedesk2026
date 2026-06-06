import {
  DateRangePreset,
  DateRangePresets,
} from '@ui/forms/input-field/date/date-range-picker/dialog/date-range-presets';
import {dateRangeToAbsoluteRange} from '@ui/forms/input-field/date/date-range-picker/form-date-range-picker';
import {message} from '@ui/i18n/message';
import {PartialWithRequired} from '@ui/utils/ts/partial-with-required';
import {
  BackendFilter,
  DatePickerFilterControl,
  FilterControlType,
  FilterOperator,
} from './backend-filter';

export function timestampFilter(
  options: PartialWithRequired<
    BackendFilter<DatePickerFilterControl>,
    'key' | 'label'
  >,
): BackendFilter<DatePickerFilterControl> {
  return {
    ...options,
    defaultOperator: FilterOperator.between,
    control: {
      type: FilterControlType.DateRangePicker,
      defaultValue:
        options.control?.defaultValue ||
        dateRangeToAbsoluteRange(
          (DateRangePresets[3] as Required<DateRangePreset>).getRangeValue(),
        ),
    },
  };
}

export function createdAtFilter(
  options?: Partial<BackendFilter<DatePickerFilterControl>>,
): BackendFilter<DatePickerFilterControl> {
  return timestampFilter({
    key: 'created_at',
    label: message('Date created'),
    ...options,
  });
}

export function updatedAtFilter(
  options?: Partial<BackendFilter<DatePickerFilterControl>>,
): BackendFilter<DatePickerFilterControl> {
  return timestampFilter({
    key: 'updated_at',
    label: message('Last updated'),
    ...options,
  });
}
