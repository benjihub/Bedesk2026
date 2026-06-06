import {mergeProps} from '@react-aria/utils';
import {useDefaultValidationRules} from '@ui/forms/use-default-validation-rules';
import {useController} from 'react-hook-form';
import {ChipField, ChipFieldProps} from './chip-field';

export type FormChipFieldProps<T> = ChipFieldProps<T> & {
  name: string;
};

export function FormChipField<T>({children, ...props}: FormChipFieldProps<T>) {
  const rules = useDefaultValidationRules({...props, multiSelect: true});
  const {
    field: {onChange, onBlur, value = [], ref},
    fieldState: {invalid, error},
  } = useController({
    name: props.name,
    rules,
  });

  const formProps: Partial<ChipFieldProps<T>> = {
    onChange,
    onBlur,
    value,
    invalid,
    errorMessage: error?.message,
  };

  return (
    <ChipField ref={ref} {...mergeProps(formProps, props)}>
      {children}
    </ChipField>
  );
}
