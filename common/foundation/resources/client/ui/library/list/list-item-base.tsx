import {CheckIcon} from '@ui/icons/material/Check';
import clsx from 'clsx';
import React, {
  ComponentPropsWithRef,
  JSXElementConstructor,
  ReactNode,
} from 'react';
import {Link, To} from 'react-router';

export interface ListItemBaseProps extends ComponentPropsWithRef<'div'> {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  endSection?: ReactNode;
  description?: ReactNode;
  textLabel?: string;
  capitalizeFirst?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  isActive?: boolean;
  className?: string;
  showCheckmark?: boolean;
  elementType?: 'a' | JSXElementConstructor<any> | 'div';
  target?: string;
  to?: To;
  href?: string;
  radius?: string;
  padding?: string;
}

export const ListItemBase = React.forwardRef<
  HTMLDivElement | null,
  ListItemBaseProps
>((props, ref) => {
  let {
    startIcon,
    capitalizeFirst,
    children,
    description,
    endIcon,
    endSection,
    isDisabled,
    isActive,
    isSelected,
    showCheckmark,
    elementType,
    radius,
    padding,
    to,
    ...domProps
  } = props;

  if (!startIcon && showCheckmark) {
    startIcon = (
      <CheckIcon
        size="sm"
        className={clsx('text-primary', !isSelected && 'invisible')}
      />
    );
  }

  // if (!endIcon && !endSection && showCheckmark) {
  //   endIcon = (
  //     <CheckIcon size="sm" className={clsx('text-primary', 'invisible')} />
  //   );
  // }

  const iconClassName = clsx(
    'icon-sm rounded overflow-hidden flex-shrink-0',
    !isDisabled && 'text-muted',
  );
  const endSectionClassName = clsx(!isDisabled && 'text-muted');

  const Element = elementType ? elementType : to ? Link : 'div';

  return (
    <Element
      {...domProps}
      to={to}
      aria-disabled={isDisabled}
      className={itemClassName(props)}
      ref={ref}
    >
      {startIcon && <div className={iconClassName}>{startIcon}</div>}
      <div
        className={clsx(
          'min-w-auto mr-auto w-full overflow-hidden overflow-ellipsis',
          capitalizeFirst && 'first-letter:capitalize',
        )}
      >
        {children}
        {description && (
          <div
            className={clsx(
              'mt-4 whitespace-normal text-xs',
              isDisabled ? 'text-disabled' : 'text-muted',
            )}
          >
            {description}
          </div>
        )}
      </div>
      {(endIcon || endSection) && (
        <div className={endIcon ? iconClassName : endSectionClassName}>
          {endIcon || endSection}
        </div>
      )}
    </Element>
  );
});

function itemClassName(props: ListItemBaseProps): string {
  const {
    className,
    showCheckmark,
    endIcon,
    endSection,
    radius,
    padding: userPadding,
  } = props;

  let padding;
  if (userPadding) {
    padding = userPadding;
  } else if (showCheckmark) {
    if (endIcon || endSection) {
      padding = 'pl-8 pr-8 py-8';
    } else {
      padding = 'pl-8 pr-24 py-8';
    }
  } else {
    padding = 'px-20 py-8';
  }

  return clsx(
    'w-full select-none outline-none cursor-pointer',
    'text-main text-sm truncate flex items-center gap-10',
    padding,
    stateStyleClassName(props),
    className,
    radius,
  );
}
function stateStyleClassName({
  isSelected,
  isActive,
  isDisabled,
}: ListItemBaseProps): string {
  if (isDisabled) {
    return 'text-disabled pointer-events-none';
  } else if (isSelected) {
    if (isActive) {
      return 'bg-primary/focus';
    } else {
      return 'bg-primary/selected hover:bg-primary/focus';
    }
  } else if (isActive) {
    return 'hover:bg-fg-base/15 bg-focus';
  } else {
    return 'hover:bg-hover';
  }
}
