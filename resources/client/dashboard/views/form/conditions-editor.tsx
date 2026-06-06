import {View} from '@app/dashboard/views/view';
import {
  BackendFilter,
  DatePickerFilterControl,
  FilterChipFieldControl,
  FilterControl,
  FilterControlType,
  FilterOperator,
  FilterSelectControl,
  FilterSelectModelControl,
  FilterTextInputControl,
} from '@common/datatable/filters/backend-filter';
import {FilterOperatorNames} from '@common/datatable/filters/filter-operator-names';
import {ChipFieldFilterValueField} from '@common/datatable/filters/panels/chip-field-filter-panel';
import {DateRangeFilterValueField} from '@common/datatable/filters/panels/date-range-filter-panel';
import {InputFilterValueField} from '@common/datatable/filters/panels/input-filter-panel';
import {NormalizedModelFilterValueField} from '@common/datatable/filters/panels/normalized-model-filter-panel';
import {SelectFilterValueField} from '@common/datatable/filters/panels/select-filter-panel';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect, Select} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {CloseIcon} from '@ui/icons/material/Close';
import {useFieldArray, useWatch} from 'react-hook-form';
import {SectionHeader} from './section-header';

interface ConditionsEditorProps {
  filters: BackendFilter[];
}
export function ConditionsEditor({filters}: ConditionsEditorProps) {
  const {fields, append, remove, update} = useFieldArray<View>({
    name: 'conditions',
  });

  const getFormValueFromFilter = (filter: BackendFilter) => {
    return {
      key: filter.key,
      operator: filter.defaultOperator,
      value:
        filter.control.type === FilterControlType.Select
          ? filter.control.options[0].value
          : '',
    };
  };

  const addNewCondition = (matchType: 'all' | 'any') => {
    const filter = filters[0];
    append({
      ...getFormValueFromFilter(filter),
      match_type: matchType,
    });
  };

  const onKeyChange = (
    index: number,
    key: string,
    matchType: 'all' | 'any',
  ) => {
    const filter = filters.find(filter => filter.key === key);
    if (filter) {
      update(index, {
        ...getFormValueFromFilter(filter),
        match_type: matchType,
      });
    }
  };

  return (
    <div>
      <SectionHeader
        description={
          <Trans message="Control which conversations appear in your view by using conditions." />
        }
      >
        <Trans message="Conditions" />
      </SectionHeader>
      <div className="mb-44">
        <Header type="all" />
        {fields.map(
          (field, index) =>
            field.match_type === 'all' && (
              <ConditionRow
                key={field.id}
                index={index}
                filters={filters}
                onRemove={() => remove(index)}
                onKeyChange={newKey => onKeyChange(index, newKey, 'all')}
              />
            ),
        )}
        <AddConditionButton onClick={() => addNewCondition('all')} />
      </div>
      <div className="mb-44">
        <Header type="any" />
        {fields.map(
          (field, index) =>
            field.match_type === 'any' && (
              <ConditionRow
                key={field.id}
                index={index}
                filters={filters}
                onRemove={() => remove(index)}
                onKeyChange={newKey => onKeyChange(index, newKey, 'any')}
              />
            ),
        )}
        <AddConditionButton onClick={() => addNewCondition('any')} />
      </div>
    </div>
  );
}

interface AddConditionButtonProps {
  onClick: () => void;
}

function AddConditionButton({onClick}: AddConditionButtonProps) {
  return (
    <Button
      variant="outline"
      startIcon={<AddIcon />}
      onClick={() => onClick()}
      size="xs"
      className="mt-12"
    >
      <Trans message="Add condition" />
    </Button>
  );
}

interface ConditionRowProps {
  index: number;
  filters: BackendFilter[];
  onRemove: () => void;
  onKeyChange: (key: string) => void;
}
function ConditionRow({
  index,
  filters,
  onRemove,
  onKeyChange,
}: ConditionRowProps) {
  const key = useWatch<View>({name: `conditions.${index}.key`});
  const selectedOperator = useWatch<View>({
    name: `conditions.${index}.operator`,
  }) as FilterOperator;
  const selectedFilter = filters.find(filter => filter.key === key);
  return (
    <div className="items-center gap-x-14 border-b border-b-divider-lighter py-14 max-md:space-y-12 md:flex">
      <Select
        selectionMode="single"
        className="max-w-280 flex-auto"
        selectedValue={key as string}
        onSelectionChange={newKey => onKeyChange(newKey as string)}
      >
        {filters.map(filter => (
          <Item key={filter.key} value={filter.key}>
            <Trans {...filter.label} />
          </Item>
        ))}
      </Select>
      {!!selectedFilter?.operators?.length && (
        <FormSelect
          selectionMode="single"
          className="max-w-180 flex-auto"
          name={`conditions.${index}.operator`}
        >
          {selectedFilter.operators.map(operator => (
            <Item key={operator} value={operator} capitalizeFirst>
              <Trans {...FilterOperatorNames[operator]} />
            </Item>
          ))}
        </FormSelect>
      )}
      {selectedFilter && selectedOperator !== FilterOperator.notNull && (
        <div className="max-w-280 flex-auto">
          <ValueField filter={selectedFilter} index={index} />
        </div>
      )}
      <IconButton color="danger" onClick={() => onRemove()}>
        <CloseIcon />
      </IconButton>
    </div>
  );
}

interface ValueFieldProps<T = FilterControl> {
  filter: BackendFilter<T>;
  index: number;
}
function ValueField({filter, index}: ValueFieldProps) {
  switch (filter.control.type) {
    case FilterControlType.DateRangePicker:
      return (
        <DateRangeFilterValueField
          filter={filter as BackendFilter<DatePickerFilterControl>}
          size="md"
          name={`conditions.${index}.value`}
        />
      );
    case FilterControlType.BooleanToggle:
      return (
        <FormSelect
          name={`conditions.${index}.value`}
          selectionMode="single"
          size="md"
        >
          <Item value={true}>
            <Trans message="Yes" />
          </Item>
          <Item value={false}>
            <Trans message="No" />
          </Item>
        </FormSelect>
      );
    case FilterControlType.Select:
      return (
        <SelectFilterValueField
          filter={filter as BackendFilter<FilterSelectControl>}
          size="md"
          name={`conditions.${index}.value`}
        />
      );
    case FilterControlType.ChipField:
      return (
        <ChipFieldFilterValueField
          filter={filter as BackendFilter<FilterChipFieldControl>}
          size="md"
          name={`conditions.${index}.value`}
        />
      );
    case FilterControlType.Input:
      return (
        <InputFilterValueField
          filter={filter as BackendFilter<FilterTextInputControl>}
          size="md"
          name={`conditions.${index}.value`}
        />
      );
    case FilterControlType.SelectModel:
      return (
        <NormalizedModelFilterValueField
          filter={filter as BackendFilter<FilterSelectModelControl>}
          size="md"
          name={`conditions.${index}.value`}
        />
      );
    default:
      return null;
  }
}

interface HeaderProps {
  type: 'all' | 'any';
}
function Header({type}: HeaderProps) {
  return (
    <h2 className="border-b pb-8 text-sm font-bold">
      <Trans
        message={
          type === 'all'
            ? 'Conversation must meet <b>all</b> of these conditions to appear in the view'
            : 'Conversation can meet <b>any</b> of these conditions to appear in the view'
        }
        values={{
          b: text => (
            <span className="mx-4 rounded border bg-alt px-6 py-2 font-bold">
              {text}
            </span>
          ),
        }}
      />
    </h2>
  );
}
