import {
  FormTextField,
  FormTextFieldProps,
} from '@ui/forms/input-field/text-field/text-field';
import {Trans} from '@ui/i18n/trans';
import React from 'react';

// 99TB
const MaxValue = 108851651149824;

export const FormFileSizeField = React.forwardRef<
  HTMLDivElement,
  FormTextFieldProps
>(({name, ...props}, ref) => {
  return (
    <FormTextField
      name={name}
      {...props}
      ref={ref}
      min={1}
      max={MaxValue}
      type="number"
      endAdornment={
        <span className="mr-12 text-xs text-muted">
          <Trans message="Bytes" />
        </span>
      }
    />
  );
});
