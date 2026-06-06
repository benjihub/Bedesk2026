import {ButtonBase, ButtonBaseProps} from '@ui/buttons/button-base';
import {ArrowDropDownIcon} from '@ui/icons/material/ArrowDropDown';
import clsx from 'clsx';
import {forwardRef, ReactNode} from 'react';

interface Props extends ButtonBaseProps {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  description?: ReactNode;
  radius?: string;
  size?: 'md' | 'lg';
}
export const SettingsSectionButton = forwardRef<HTMLButtonElement, Props>(
  (
    {
      startIcon,
      children,
      className,
      description,
      endIcon,
      size = 'md',
      radius = 'rounded-input',
      ...other
    },
    ref,
  ) => {
    return (
      <ButtonBase
        ref={ref}
        display="flex"
        className={clsx(
          size === 'md' ? 'h-42' : 'h-[58px]',
          radius,
          'relative mb-10 w-full items-center gap-10',
          'border bg px-14 hover:bg-hover',
          className,
          other.disabled && 'pointer-events-none opacity-50',
        )}
        variant={null}
        {...other}
      >
        {startIcon}
        <span className="block min-w-0">
          <span className="block text-sm">{children}</span>
          {description && (
            <span className="block overflow-hidden overflow-ellipsis whitespace-nowrap text-xs text-muted">
              {description}
            </span>
          )}
        </span>
        <div className="ml-auto">
          {endIcon ?? (
            <ArrowDropDownIcon aria-hidden className="text-muted icon-sm" />
          )}
        </div>
      </ButtonBase>
    );
  },
);
