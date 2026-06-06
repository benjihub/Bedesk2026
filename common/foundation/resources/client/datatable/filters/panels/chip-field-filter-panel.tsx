import {FilterChipFieldControl} from '@common/datatable/filters/backend-filter';
import {FilterPanelProps} from '@common/datatable/filters/panels/filter-panel-props';
import {FormNormalizedModelChipField} from '@common/tags/form-normalized-model-chip-field';
import {FormChipField} from '@ui/forms/input-field/chip-field/form-chip-field';
import {InputSize} from '@ui/forms/input-field/input-size';
import {Item} from '@ui/forms/listbox/item';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';

type ChipFieldFilterValueFieldProps =
  FilterPanelProps<FilterChipFieldControl> & {
    name: string;
    size?: InputSize;
  };

export function ChipFieldFilterPanel({
  filter,
}: FilterPanelProps<FilterChipFieldControl>) {
  return (
    <ChipFieldFilterValueField filter={filter} name={`${filter.key}.value`} />
  );
}

export function ChipFieldFilterValueField({
  filter,
  name,
  size = 'sm',
}: ChipFieldFilterValueFieldProps) {
  const {trans} = useTrans();
  if (filter.control.autocompleteEndpoint) {
    return (
      <FormNormalizedModelChipField
        name={name}
        size={size}
        placeholder={
          filter.control.placeholder
            ? trans(filter.control.placeholder)
            : undefined
        }
        endpoint={filter.control.autocompleteEndpoint}
      />
    );
  }
  return (
    <FormChipField
      size={size}
      name={name}
      valueKey="id"
      allowCustomValue={false}
      showDropdownArrow
      isAsync
      placeholder={
        filter.control.placeholder
          ? trans(filter.control.placeholder)
          : undefined
      }
      displayWith={chip => {
        const o = filter.control.options?.find(o => o.key === chip.id);
        if (!o) return undefined;
        return typeof o.label === 'string' ? o.label : o.label.message;
      }}
      suggestions={filter.control.options?.map(o => ({
        id: o.key,
        name: typeof o.label === 'string' ? o.label : o.label.message,
      }))}
    >
      {chip => (
        <Item key={chip.id} value={chip.id}>
          {<Trans message={chip.name} />}
        </Item>
      )}
    </FormChipField>
  );
}
