import clsx from 'clsx';
import React from 'react';
import {ButtonProps} from './button';
import {ButtonSize} from './button-size';
import {ButtonColor, ButtonVariant} from './get-shared-button-style';

export interface ButtonGroupProps {
  children: React.ReactNode[];
  color?: ButtonColor;
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: string;
  className?: string;
  value?: any;
  onChange?: (newValue: any) => void;
  multiple?: boolean;
  disabled?: boolean;
}
export function ButtonGroup({
  children,
  color,
  variant,
  radius = 'rounded-button',
  size,
  className,
  value,
  onChange,
  multiple,
  disabled,
}: ButtonGroupProps) {
  const isActive = (childValue: any): boolean => {
    // assume that button group is not used as a toggle group, if there is no value given
    if (value === undefined) return false;
    if (multiple) {
      return (value as any[]).includes(childValue);
    }
    return childValue === value;
  };

  const toggleMultipleValue = (childValue: any) => {
    const newValue = [...value];
    const childIndex = value.indexOf(childValue);
    if (childIndex > -1) {
      newValue.splice(childIndex, 1);
    } else {
      newValue.push(childValue);
    }
    return newValue;
  };

  const buttons = React.Children.map(children, (button, i) => {
    if (React.isValidElement(button)) {
      const buttonProps = button.props as ButtonProps;
      const active = isActive(buttonProps.value);
      const adjustedColor = active ? 'primary' : color;
      return React.cloneElement<ButtonProps>(button as any, {
        color: active ? 'primary' : color,
        variant,
        size,
        radius: null,
        disabled: buttonProps.disabled || disabled,
        ...buttonProps,
        onClick: e => {
          if (buttonProps.onClick) {
            buttonProps.onClick(e);
          }
          if (!onChange) return;
          if (multiple) {
            onChange?.(toggleMultipleValue(buttonProps.value));
          } else {
            onChange?.(buttonProps.value);
          }
        },
        className: clsx(
          buttonProps.className,
          // borders are hidden via negative margin, make sure both are visible for active item
          active ? 'z-20' : 'z-10',
          getStyle(i, children, radius, adjustedColor),
        ),
      });
    }
  });
  return (
    <div className={clsx(radius, 'isolate inline-flex', className)}>
      {buttons}
    </div>
  );
}

function getStyle(
  i: number,
  children: ButtonGroupProps['children'],
  radius: ButtonGroupProps['radius'],
  color?: ButtonColor,
): string {
  // first
  if (i === 0) {
    return clsx(
      radius,
      'rounded-tr-none rounded-br-none',
      !color && 'border-r-transparent disabled:border-r-transparent',
    );
  }
  // last
  if (i === children.length - 1) {
    return clsx(radius, 'rounded-tl-none rounded-bl-none -ml-1');
  }
  return clsx(
    'rounded-none -ml-1',
    !color && 'border-r-transparent disabled:border-r-transparent',
  );
}
