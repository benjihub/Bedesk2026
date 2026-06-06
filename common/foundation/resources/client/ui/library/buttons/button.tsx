import {IconSize} from '@ui/icons/svg-icon';
import clsx from 'clsx';
import React, {ReactElement} from 'react';
import {ButtonBase, ButtonBaseProps} from './button-base';
import {ButtonSize, getButtonSizeStyle} from './button-size';

export interface ButtonProps extends ButtonBaseProps {
  size?: ButtonSize;
  sizeClassName?: string;
  equalWidth?: boolean;
  startIcon?: ReactElement | null | false;
  endIcon?: ReactElement | null | false;
  fontWeight?: string;
  padding?: string;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      startIcon,
      endIcon,
      size = 'sm',
      sizeClassName,
      className,
      equalWidth = false,
      radius = 'rounded-button',
      variant = 'text',
      disabled,
      elementType,
      to,
      replace,
      href,
      download,
      fontWeight = 'font-semibold',
      padding,
      ...other
    },
    ref,
  ) => {
    const mergedClassName = clsx(
      fontWeight,
      sizeClassName || getButtonSizeStyle(size, {equalWidth, variant, padding}),
      className,
    );
    return (
      <ButtonBase
        className={mergedClassName}
        ref={ref}
        radius={radius}
        variant={variant}
        disabled={disabled}
        to={disabled ? undefined : to}
        href={disabled ? undefined : href}
        download={disabled ? undefined : download}
        elementType={disabled ? undefined : elementType}
        replace={disabled ? undefined : replace}
        {...other}
      >
        {startIcon && (
          <InlineIcon position="start" icon={startIcon} size={size} />
        )}
        {children}
        {endIcon && <InlineIcon position="end" icon={endIcon} size={size} />}
      </ButtonBase>
    );
  },
);

type InlineIconProps = {
  icon: ReactElement<any>;
  position: 'start' | 'end';
  size?: IconSize | null;
};
function InlineIcon({icon, position, size}: InlineIconProps): ReactElement {
  const className = clsx(
    'm-auto',
    {
      '-ml-4 mr-8': position === 'start',
      '-mr-4 ml-8': position === 'end',
    },
    icon.props.className,
  );
  // don't override size, if it was explicitly set on the icon
  return React.cloneElement(icon, {className, size: icon.props.size ?? size});
}
