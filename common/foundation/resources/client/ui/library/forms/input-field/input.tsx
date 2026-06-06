import {FocusScope} from '@react-aria/focus';
import clsx from 'clsx';
import React, {ComponentPropsWithoutRef, CSSProperties, ReactNode} from 'react';

interface InputProps {
  className?: string;
  children: ReactNode;
  autoFocus?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  inputProps?: ComponentPropsWithoutRef<'div'>;
  wrapperProps?: ComponentPropsWithoutRef<'div'>;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const Input = React.forwardRef<HTMLDivElement, InputProps>(
  (props, ref) => {
    const {
      children,
      inputProps,
      wrapperProps,
      className,
      autoFocus,
      style,
      onClick,
    } = props;

    return (
      <div {...wrapperProps} onClick={onClick}>
        <div
          {...inputProps}
          role="group"
          className={clsx(
            className,
            'flex items-center focus-within:border-primary/90 focus-within:ring-1 focus-within:ring-inset focus-within:ring-primary/90',
          )}
          ref={ref}
          style={style}
        >
          <FocusScope autoFocus={autoFocus}>{children}</FocusScope>
        </div>
      </div>
    );
  },
);
