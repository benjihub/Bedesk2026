import {useControlledState} from '@react-stately/utils';
import {InputSize} from '@ui/forms/input-field/input-size';
import clsx from 'clsx';
import {
  ChangeEventHandler,
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useId,
  useRef,
} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import {getInputFieldClassNames} from '../input-field/get-input-field-class-names';
import {Orientation} from '../orientation';
import {CheckboxProps} from './checkbox';

interface CheckboxGroupProps {
  children: ReactElement<CheckboxProps> | ReactElement<CheckboxProps>[];
  orientation?: Orientation;
  className?: string;
  value?: (string | number)[];
  defaultValue?: (string | number)[];
  onChange?: (newValue: (string | number)[]) => void;
  label?: ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  size?: InputSize;
  description?: ReactNode;
}
export function CheckboxGroup(props: CheckboxGroupProps) {
  const {
    label,
    children,
    orientation = 'vertical',
    value,
    defaultValue,
    onChange,
    className,
    disabled,
    readOnly,
    invalid,
    size,
    description,
  } = props;
  const ref = useRef(null);

  const labelId = useId();
  const [selectedValues, setSelectedValues] = useControlledState(
    value,
    defaultValue || [],
    onChange,
  );

  const style = getInputFieldClassNames(props);

  const handleCheckboxToggle: ChangeEventHandler<HTMLInputElement> =
    useCallback(
      e => {
        const c = e.currentTarget.value;
        const i = selectedValues.indexOf(c);
        if (i > -1) {
          selectedValues.splice(i, 1);
        } else {
          selectedValues.push(c);
        }
        setSelectedValues([...selectedValues]);
      },
      [selectedValues, setSelectedValues],
    );

  return (
    <div className={className} role="group" aria-labelledby={labelId} ref={ref}>
      {label && (
        <span id={labelId} className={style.label}>
          {label}
        </span>
      )}
      <div
        role="presentation"
        className={clsx(
          'flex gap-8',
          label ? 'mt-6' : 'mt-0',
          orientation === 'vertical' ? 'flex-col' : 'flow-row',
        )}
      >
        {Children.map(children, child => {
          if (isValidElement(child)) {
            return cloneElement<CheckboxProps>(child, {
              size,
              disabled: child.props.disabled || disabled,
              readOnly: child.props.readOnly || readOnly,
              invalid: child.props.invalid || invalid,
              checked: selectedValues?.includes(child.props.value as string),
              onChange: handleCheckboxToggle,
            });
          }
        })}
      </div>
      {description && (
        <div className={style.description} id={`${labelId}-description`}>
          {description}
        </div>
      )}
    </div>
  );
}

interface FormCheckboxGroupProps extends CheckboxGroupProps {
  name: string;
}
export function FormCheckboxGroup({
  children,
  ...props
}: FormCheckboxGroupProps) {
  const value = useWatch({
    name: props.name,
  });
  const {setValue} = useFormContext();
  return (
    <CheckboxGroup
      {...props}
      value={value || []}
      onChange={newValue => {
        setValue(props.name, newValue, {shouldDirty: true});
      }}
    >
      {children}
    </CheckboxGroup>
  );
}
