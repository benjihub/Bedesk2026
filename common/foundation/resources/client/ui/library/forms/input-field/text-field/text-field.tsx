import {mergeProps, useObjectRef} from '@react-aria/utils';
import {useDefaultValidationRules} from '@ui/forms/use-default-validation-rules';
import React, {forwardRef, HTMLProps, Ref} from 'react';
import {useController} from 'react-hook-form';
import {BaseFieldPropsWithDom} from '../base-field-props';
import {Field} from '../field';
import {getInputFieldClassNames} from '../get-input-field-class-names';
import {useField} from '../use-field';

export interface TextFieldProps
  extends BaseFieldPropsWithDom<HTMLInputElement> {
  rows?: number;
  inputElementType?: 'input' | 'textarea';
  inputRef?: Ref<HTMLInputElement | null>;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
export const TextField = forwardRef<HTMLDivElement, TextFieldProps>(
  (
    {
      inputElementType = 'input',
      flexibleHeight,
      inputRef,
      inputTestId,
      ...props
    },
    ref,
  ) => {
    const inputObjRef = useObjectRef(inputRef);

    const {fieldProps, inputProps} = useField<HTMLInputElement>({
      ...props,
      focusRef: inputObjRef,
    });

    const isTextArea = inputElementType === 'textarea';
    const ElementType: React.ElementType = isTextArea ? 'textarea' : 'input';
    const inputFieldClassNames = getInputFieldClassNames({
      ...props,
      flexibleHeight: flexibleHeight || inputElementType === 'textarea',
    });

    if (inputElementType === 'textarea' && !props.unstyled) {
      inputFieldClassNames.input = `${inputFieldClassNames.input} py-12`;
    }

    return (
      <Field ref={ref} fieldClassNames={inputFieldClassNames} {...fieldProps}>
        <ElementType
          data-testid={inputTestId}
          ref={inputObjRef}
          {...(inputProps as any)}
          rows={
            isTextArea
              ? (inputProps as HTMLProps<HTMLTextAreaElement>).rows || 4
              : undefined
          }
          className={inputFieldClassNames.input}
        />
      </Field>
    );
  },
);

export interface FormTextFieldProps extends TextFieldProps {
  name: string;
  errorMessageName?: string;
}
export const FormTextField = React.forwardRef<
  HTMLDivElement,
  FormTextFieldProps
>((props, ref) => {
  const rules = useDefaultValidationRules(props);
  const {
    field: {onChange, onBlur, value = '', ref: inputRef},
    fieldState: {invalid, error},
  } = useController({
    name: props.name,
    rules,
  });

  const formProps: TextFieldProps = {
    onChange,
    onBlur,
    // avoid `value` prop on `input` should not be null error when setting form defaults from backend model
    value: value == null ? '' : value,
    invalid,
    errorMessage: error?.message,
    inputRef,
  };

  return <TextField ref={ref} {...mergeProps(formProps, props)} />;
});
