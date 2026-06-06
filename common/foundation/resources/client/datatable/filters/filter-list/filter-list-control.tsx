import {ChipFieldFilterPanel} from '@common/datatable/filters/panels/chip-field-filter-panel';
import {useNormalizedModel} from '@common/ui/normalized-model/use-normalized-model';
import {Avatar} from '@ui/avatar/avatar';
import {DateRangePresets} from '@ui/forms/input-field/date/date-range-picker/dialog/date-range-presets';
import {AbsoluteDateRange} from '@ui/forms/input-field/date/date-range-picker/form-date-range-picker';
import {FormattedDateTimeRange} from '@ui/i18n/formatted-date-time-range';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {Skeleton} from '@ui/skeleton/skeleton';
import {NormalizedModel} from '@ui/types/normalized-model';
import {Fragment, Key, ReactNode} from 'react';
import {FilterItemFormValue} from '../add-filter-dialog';
import {
  BackendFilter,
  CustomFilterControl,
  DatePickerFilterControl,
  FilterBooleanToggleControl,
  FilterChipFieldControl,
  FilterControl,
  FilterControlType,
  FilterNumberInputControl,
  FilterOperator,
  FilterSelectControl,
  FilterSelectModelControl,
  FilterTextInputControl,
} from '../backend-filter';
import {FilterOperatorNames} from '../filter-operator-names';
import {DateRangeFilterPanel} from '../panels/date-range-filter-panel';
import {InputFilterPanel} from '../panels/input-filter-panel';
import {NormalizedModelFilterPanel} from '../panels/normalized-model-filter-panel';
import {SelectFilterPanel} from '../panels/select-filter-panel';
import {FilterListItemDialogTrigger} from './filter-list-item-dialog-trigger';
import {FilterListTriggerButton} from './filter-list-trigger-button';

export interface FilterListControlProps<T = unknown, E = FilterControl> {
  filter: BackendFilter<E>;
  onValueChange: (value: FilterItemFormValue<T>) => void;
  value: T;
  operator?: FilterOperator;
  isInactive?: boolean;
}
export function FilterListControl(props: FilterListControlProps<any, any>) {
  switch (props.filter.control.type) {
    case FilterControlType.DateRangePicker:
      return <DatePickerControl {...props} />;
    case FilterControlType.BooleanToggle:
      return <BooleanToggleControl {...props} />;
    case FilterControlType.Select:
      return <SelectControl {...props} />;
    case FilterControlType.ChipField:
      return <ChipFieldControl {...props} />;
    case FilterControlType.Input:
      return <InputControl {...props} />;
    case FilterControlType.SelectModel:
      return <SelectModelControl {...props} />;
    case FilterControlType.Custom:
      const Control = (props.filter.control as CustomFilterControl).listItem;
      return <Control {...props} />;
    default:
      return null;
  }
}

function DatePickerControl(
  props: FilterListControlProps<
    Required<AbsoluteDateRange>,
    DatePickerFilterControl
  >,
) {
  const {value, filter} = props;

  let valueLabel: ReactNode;
  if (value.preset !== undefined) {
    valueLabel = <Trans {...DateRangePresets[value.preset].label} />;
  } else {
    valueLabel = (
      <FormattedDateTimeRange
        start={new Date(value.start)}
        end={new Date(value.end)}
        options={{dateStyle: 'medium'}}
      />
    );
  }

  return (
    <FilterListItemDialogTrigger
      {...props}
      label={valueLabel}
      panel={<DateRangeFilterPanel filter={filter} />}
    />
  );
}

function BooleanToggleControl({
  filter,
  isInactive,
  onValueChange,
}: FilterListControlProps<
  FilterBooleanToggleControl['defaultValue'],
  FilterBooleanToggleControl
>) {
  return (
    <FilterListTriggerButton
      onClick={() => {
        onValueChange({value: filter.control.defaultValue});
      }}
      filter={filter}
      isInactive={isInactive}
    />
  );
}

function SelectControl(
  props: FilterListControlProps<Key, FilterSelectControl>,
) {
  const {filter, value} = props;
  const option = filter.control.options.find(o => o.key === value);
  return (
    <FilterListItemDialogTrigger
      {...props}
      label={
        option ? (
          typeof option.label === 'string' ? (
            option.label
          ) : (
            <Trans {...option.label} />
          )
        ) : null
      }
      panel={<SelectFilterPanel filter={filter} />}
    />
  );
}

function ChipFieldControl(
  props: FilterListControlProps<string[], FilterChipFieldControl>,
) {
  const label = props.filter.control.autocompleteEndpoint ? (
    props.value.map(v => (v as unknown as NormalizedModel).name).join(', ')
  ) : (
    <MultipleValues {...props} />
  );
  return (
    <FilterListItemDialogTrigger
      {...props}
      label={label}
      panel={<ChipFieldFilterPanel filter={props.filter} />}
    />
  );
}

function MultipleValues(
  props: FilterListControlProps<string[], FilterChipFieldControl>,
) {
  const {trans} = useTrans();
  const {filter, value} = props;

  const options = value.map(v =>
    filter.control.options?.find(o => o.key === v),
  );
  const maxShownCount = 3;
  const notShownCount = value.length - maxShownCount;

  // translate names, add commas and limit to 3
  const names = (
    <Fragment>
      {options
        .filter(Boolean)
        .slice(0, maxShownCount)
        .map((o, i) => {
          let name = '';
          if (i !== 0) {
            name += ', ';
          }
          name += typeof o!.label === 'string' ? o!.label : trans(o!.label);
          return name;
        })}
    </Fragment>
  );

  // indicate that there are some names not shown
  return notShownCount > 0 ? (
    <Trans
      message=":names + :count more"
      values={{names: names, count: notShownCount}}
    />
  ) : (
    names
  );
}

function InputControl(
  props: FilterListControlProps<
    string,
    FilterTextInputControl | FilterNumberInputControl
  >,
) {
  const {filter, value, operator} = props;

  const operatorLabel = operator ? (
    <Trans {...FilterOperatorNames[operator]} />
  ) : null;

  const formattedValue =
    filter.control.inputType === 'number' ? (
      <FormattedNumber value={value as any} />
    ) : (
      value
    );

  return (
    <FilterListItemDialogTrigger
      {...props}
      label={
        <Fragment>
          {operatorLabel} {formattedValue}
        </Fragment>
      }
      panel={<InputFilterPanel filter={filter} />}
    />
  );
}

function SelectModelControl(
  props: FilterListControlProps<string, FilterSelectModelControl>,
) {
  const {value, filter} = props;
  const {isLoading, data} = useNormalizedModel(
    filter.control.endpoint
      ? `${filter.control.endpoint}/${value}`
      : `normalized-models/${filter.control.model}/${value}`,
    undefined,
    {enabled: !!value},
  );

  const skeleton = (
    <Fragment>
      <Skeleton variant="avatar" size="w-18 h-18 mr-6" />
      <Skeleton variant="rect" size="w-50" />
    </Fragment>
  );
  const modelPreview = (
    <Fragment>
      <Avatar
        size="xs"
        src={data?.model.image}
        label={data?.model.name}
        className="mr-6"
      />
      {data?.model.name}
    </Fragment>
  );

  const label = isLoading || !data ? skeleton : modelPreview;

  return (
    <FilterListItemDialogTrigger
      {...props}
      label={label}
      panel={<NormalizedModelFilterPanel filter={filter} />}
    />
  );
}
