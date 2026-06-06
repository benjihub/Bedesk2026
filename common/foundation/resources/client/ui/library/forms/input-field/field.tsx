import {Adornment} from '@ui/forms/input-field/adornment';
import {BaseFieldProps} from '@ui/forms/input-field/base-field-props';
import {InputFieldStyle} from '@ui/forms/input-field/get-input-field-class-names';
import {removeEmptyValuesFromObject} from '@ui/utils/objects/remove-empty-values-from-object';
import clsx from 'clsx';
import React, {ComponentPropsWithoutRef, ReactElement, ReactNode} from 'react';

export interface FieldProps extends BaseFieldProps {
  children: ReactNode;
  wrapperProps?: ComponentPropsWithoutRef<'div'>;
  labelProps?: ComponentPropsWithoutRef<'label' | 'span'>;
  descriptionProps?: ComponentPropsWithoutRef<'div'>;
  errorMessageProps?: ComponentPropsWithoutRef<'div'>;
  fieldClassNames: InputFieldStyle;
}
export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  (props, ref) => {
    const {
      children,
      // Not every component that uses <Field> supports help text.
      description,
      descriptionPosition = 'bottom',
      errorMessage,
      descriptionProps = {},
      errorMessageProps = {},
      startAdornment,
      endAdornment,
      adornmentPosition,
      startAppend,
      endAppend,
      fieldClassNames,
      disabled,
      wrapperProps,
    } = props;

    const descriptionEl = description && (
      <div className={fieldClassNames.description} {...descriptionProps}>
        {description}
      </div>
    );

    return (
      <div className={fieldClassNames.wrapper} ref={ref} {...wrapperProps}>
        <Label {...props} />
        {descriptionPosition === 'top' && descriptionEl}
        <div className={fieldClassNames.inputWrapper}>
          <Adornment
            direction="start"
            className={fieldClassNames.adornment}
            position={adornmentPosition}
          >
            {startAdornment}
          </Adornment>
          {startAppend && (
            <Append style={fieldClassNames.append} disabled={disabled}>
              {startAppend}
            </Append>
          )}
          {children}
          {endAppend && (
            <Append style={fieldClassNames.append} disabled={disabled}>
              {endAppend}
            </Append>
          )}
          <Adornment
            direction="end"
            className={fieldClassNames.adornment}
            position={adornmentPosition}
          >
            {endAdornment}
          </Adornment>
        </div>
        {!errorMessage && descriptionPosition === 'bottom' && descriptionEl}
        {errorMessage && (
          <div className={fieldClassNames.error} {...errorMessageProps}>
            {errorMessage}
          </div>
        )}
      </div>
    );
  },
);

function Label({
  labelElementType,
  fieldClassNames,
  labelProps,
  label,
  labelSuffix,
  labelSuffixPosition = 'spaced',
  required,
}: Omit<FieldProps, 'children'>) {
  if (!label) {
    return null;
  }

  const ElementType = labelElementType || 'label';
  const labelNode = (
    <ElementType className={fieldClassNames.label} {...labelProps}>
      {label}
      {required && <span className="text-danger"> *</span>}
    </ElementType>
  );

  if (labelSuffix) {
    return (
      <div
        className={clsx(
          'mb-4 flex w-full gap-4',
          labelSuffixPosition === 'spaced' ? 'items-end' : 'items-center',
        )}
      >
        {labelNode}
        <div
          className={clsx(
            'text-xs text-muted',
            labelSuffixPosition === 'spaced' ? 'ml-auto' : '',
          )}
        >
          {labelSuffix}
        </div>
      </div>
    );
  }

  return labelNode;
}

interface AppendProps {
  children: ReactElement<any>;
  style: InputFieldStyle['append'];
  disabled?: boolean;
}
function Append({children, style, disabled}: AppendProps) {
  return React.cloneElement(children, {
    ...children.props,
    disabled: children.props.disabled || disabled,
    // make sure append styles are not overwritten with empty values
    ...removeEmptyValuesFromObject(style),
  });
}
