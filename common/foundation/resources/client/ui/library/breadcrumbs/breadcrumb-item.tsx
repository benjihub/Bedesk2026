import {ChevronRightIcon} from '@ui/icons/material/ChevronRight';
import clsx from 'clsx';
import {HTMLAttributes, ReactElement, ReactNode} from 'react';
import {Link} from 'react-router';
import type {BreadcrumbSizeStyle} from './breadcrumb';

export interface BreadcrumbItemProps {
  sizeStyle?: BreadcrumbSizeStyle;
  isMenuTrigger?: boolean;
  isMenuItem?: boolean;
  children: ReactNode | ((state: {isMenuItem?: boolean}) => ReactNode);
  isCurrent?: boolean;
  onSelected?: () => void;
  isClickable?: boolean;
  isDisabled?: boolean;
  inactiveMuted?: boolean;
  className?: string;
  isLink?: boolean;
  to?: string;
  relative?: string;
}
export function BreadcrumbItem(props: BreadcrumbItemProps) {
  const {
    isCurrent,
    sizeStyle,
    isMenuTrigger,
    isClickable,
    isDisabled,
    inactiveMuted,
    onSelected,
    className,
    isMenuItem,
    isLink,
    to,
    relative,
  } = props;

  const children =
    typeof props.children === 'function'
      ? props.children({isMenuItem})
      : props.children;

  if (isMenuItem) {
    return children as ReactElement;
  }

  const domProps: HTMLAttributes<HTMLDivElement> & {
    to?: string;
    relative?: string;
  } = isMenuTrigger
    ? {}
    : {
        tabIndex: isLink && !isDisabled ? 0 : undefined,
        role: isLink ? 'link' : undefined,
        'aria-disabled': isLink ? isDisabled : undefined,
        'aria-current': isCurrent && isLink ? 'page' : undefined,
        onClick: () => onSelected?.(),
        to,
        relative,
      };

  const Component = (to ? Link : 'div') as any;

  return (
    <li
      className={clsx(
        `relative inline-flex min-w-0 flex-shrink-0 items-center justify-start transition-button ${sizeStyle?.font}`,
        (!isClickable || isDisabled) && 'pointer-events-none',
        !isCurrent && isDisabled && 'text-disabled',
        !isCurrent && !isDisabled && inactiveMuted && 'text-muted',
      )}
    >
      <Component
        {...domProps}
        className={clsx(
          className,
          'cursor-pointer overflow-hidden whitespace-nowrap rounded-button px-6',
          !isMenuTrigger && 'py-2 hover:bg-hover',
          !isMenuTrigger && (isLink || to) && 'outline-none focus-visible:ring',
        )}
      >
        {children}
      </Component>
      {isCurrent === false && (
        <ChevronRightIcon
          size={sizeStyle?.icon}
          className={clsx(isDisabled && 'text-disabled')}
        />
      )}
    </li>
  );
}
