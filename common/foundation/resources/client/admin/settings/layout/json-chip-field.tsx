import {mergeProps} from '@react-aria/utils';
import {
  ChipField,
  ChipValue,
} from '@ui/forms/input-field/chip-field/chip-field';
import {FormChipFieldProps} from '@ui/forms/input-field/chip-field/form-chip-field';
import {useMemo} from 'react';
import {useController} from 'react-hook-form';

export function JsonChipField({children, ...props}: FormChipFieldProps<any>) {
  const {
    field: {onChange, onBlur, value = [], ref},
    fieldState: {invalid, error},
  } = useController({
    name: props.name,
  });

  const arrayValue = useMemo(() => {
    const mixedValue = value as string | string[];
    return typeof mixedValue === 'string' ? JSON.parse(mixedValue) : mixedValue;
  }, [value]);

  const formProps: Partial<FormChipFieldProps<ChipValue>> = {
    onChange,
    onBlur,
    value: arrayValue,
    invalid,
    errorMessage: error?.message,
  };

  return (
    <ChipField valueKey="name" ref={ref} {...mergeProps(formProps, props)}>
      {children}
    </ChipField>
  );
}
