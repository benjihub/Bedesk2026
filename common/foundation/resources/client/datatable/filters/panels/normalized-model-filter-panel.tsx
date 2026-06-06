import {FilterSelectModelControl} from '@common/datatable/filters/backend-filter';
import {FormNormalizedModelField} from '@common/ui/normalized-model/normalized-model-field';
import {InputSize} from '@ui/forms/input-field/input-size';
import {FilterPanelProps} from './filter-panel-props';

type NormalizedModelFilterValueFieldProps =
  FilterPanelProps<FilterSelectModelControl> & {
    name: string;
    size?: InputSize;
  };

export function NormalizedModelFilterPanel({
  filter,
}: FilterPanelProps<FilterSelectModelControl>) {
  return (
    <NormalizedModelFilterValueField
      filter={filter}
      name={`${filter.key}.value`}
    />
  );
}

export function NormalizedModelFilterValueField({
  filter,
  name,
  size = 'sm',
}: NormalizedModelFilterValueFieldProps) {
  return (
    <FormNormalizedModelField
      name={name}
      size={size}
      endpoint={
        filter.control.endpoint
          ? filter.control.endpoint
          : `normalized-models/${filter.control.model}`
      }
    />
  );
}
