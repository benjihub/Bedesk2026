import {FilterSelectControl} from '@common/datatable/filters/backend-filter';
import {FilterPanelProps} from '@common/datatable/filters/panels/filter-panel-props';
import {Avatar} from '@ui/avatar/avatar';
import {InputSize} from '@ui/forms/input-field/input-size';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';

export function SelectFilterPanel({
  filter,
}: FilterPanelProps<FilterSelectControl>) {
  return (
    <SelectFilterValueField filter={filter} name={`${filter.key}.value`} />
  );
}

type SelectFiterValueField = FilterPanelProps<FilterSelectControl> & {
  name: string;
  size?: InputSize;
};
export function SelectFilterValueField({
  filter,
  name,
  size = 'sm',
}: SelectFiterValueField) {
  const {trans} = useTrans();
  return (
    <FormSelect
      size={size}
      name={name}
      selectionMode="single"
      showSearchField={filter.control.showSearchField}
      placeholder={
        filter.control.placeholder
          ? trans(filter.control.placeholder)
          : undefined
      }
      searchPlaceholder={
        filter.control.searchPlaceholder
          ? trans(filter.control.searchPlaceholder)
          : undefined
      }
    >
      {filter.control.options.map(option => (
        <Item
          key={option.key}
          value={option.key}
          startIcon={
            filter.control.showAvatar ? (
              <Avatar
                size="sm"
                src={option.image}
                label={
                  typeof option.label === 'object'
                    ? option.label.message
                    : option.label
                }
              />
            ) : null
          }
        >
          {typeof option.label === 'string' ? (
            option.label
          ) : (
            <Trans {...option.label} />
          )}
        </Item>
      ))}
    </FormSelect>
  );
}
