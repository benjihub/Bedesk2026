import {
  FilterNumberInputControl,
  FilterTextInputControl,
} from '@common/datatable/filters/backend-filter';
import {FilterOperatorNames} from '@common/datatable/filters/filter-operator-names';
import {FilterPanelProps} from '@common/datatable/filters/panels/filter-panel-props';
import {InputSize} from '@ui/forms/input-field/input-size';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {FormSelect} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {Fragment} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';

type InputFilterValueFieldProps = FilterPanelProps<
  FilterTextInputControl | FilterNumberInputControl
> & {
  name: string;
  size?: InputSize;
};

export function InputFilterPanel({
  filter,
}: FilterPanelProps<FilterTextInputControl | FilterNumberInputControl>) {
  const form = useFormContext();
  const selectedOperator = useWatch({
    control: form.control,
    name: `${filter.key}.operator`,
  });
  return (
    <Fragment>
      {filter.operators?.length ? (
        <FormSelect
          selectionMode="single"
          name={`${filter.key}.operator`}
          className="mb-14"
          size="sm"
        >
          {filter.operators?.map(operator => (
            <Item key={operator} value={operator}>
              {<Trans {...FilterOperatorNames[operator]} />}
            </Item>
          ))}
        </FormSelect>
      ) : null}
      {selectedOperator === 'notNull' ? null : (
        <InputFilterValueField filter={filter} name={`${filter.key}.value`} />
      )}
    </Fragment>
  );
}

export function InputFilterValueField({
  filter,
  name,
  size = 'sm',
}: InputFilterValueFieldProps) {
  const control = filter.control;
  return (
    <FormTextField
      size={size}
      name={name}
      type={filter.control.inputType}
      min={'minValue' in control ? control.minValue : undefined}
      max={'maxValue' in control ? control.maxValue : undefined}
      minLength={'minLength' in control ? control.minLength : undefined}
      maxLength={'maxLength' in control ? control.maxLength : undefined}
    />
  );
}
