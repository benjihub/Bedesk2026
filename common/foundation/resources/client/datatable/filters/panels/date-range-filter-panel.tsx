import {DatePickerFilterControl} from '@common/datatable/filters/backend-filter';
import {FilterPanelProps} from '@common/datatable/filters/panels/filter-panel-props';
import {FormDateRangePicker} from '@ui/forms/input-field/date/date-range-picker/form-date-range-picker';
import {InputSize} from '@ui/forms/input-field/input-size';

type DateRangeFilterValueFieldProps =
  FilterPanelProps<DatePickerFilterControl> & {
    name: string;
    size?: InputSize;
  };

export function DateRangeFilterValueField({
  filter,
  name,
  size = 'sm',
}: DateRangeFilterValueFieldProps) {
  return (
    <FormDateRangePicker
      min={filter.control.min}
      max={filter.control.max}
      size={size}
      name={name}
      granularity="day"
      closeDialogOnSelection={true}
    />
  );
}

export function DateRangeFilterPanel({
  filter,
}: FilterPanelProps<DatePickerFilterControl>) {
  return (
    <DateRangeFilterValueField filter={filter} name={`${filter.key}.value`} />
  );
}
