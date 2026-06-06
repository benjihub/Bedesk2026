import {useFocusManager} from '@react-aria/focus';
import {ButtonBase} from '@ui/buttons/button-base';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {WarningIcon} from '@ui/icons/material/Warning';
import {Tooltip} from '@ui/tooltip/tooltip';
import clsx from 'clsx';
import React, {
  cloneElement,
  JSXElementConstructor,
  ReactElement,
  ReactNode,
  useRef,
} from 'react';
import {To} from 'react-router';
import {CancelFilledIcon} from './cancel-filled-icon';

export interface ChipProps {
  onRemove?: () => void;
  disabled?: boolean;
  selectable?: boolean;
  invalid?: boolean;
  errorMessage?: ReactElement<MessageDescriptor> | string;
  children?: ReactNode;
  className?: string;
  adornment?: null | ReactElement<{
    size: string;
    className?: string;
  }>;
  radius?: string;
  color?: 'chip' | 'primary' | 'danger' | 'positive';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fontWeight?: string;
  elementType?: 'div' | 'a' | JSXElementConstructor<any>;
  to?: To;
  onClick?: (e: React.MouseEvent) => void;
}
export function Chip(props: ChipProps) {
  const {
    onRemove,
    disabled,
    invalid,
    errorMessage,
    children,
    className,
    selectable = false,
    radius = 'rounded-full',
    elementType = 'div',
    fontWeight: fontSize,
    to,
    onClick,
  } = props;
  const chipRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const focusManager = useFocusManager();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        focusManager?.focusNext({tabbable: true});
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        focusManager?.focusPrevious({tabbable: true});
        break;
      case 'Backspace':
      case 'Delete':
        if (chipRef.current === document.activeElement) {
          onRemove?.();
        }
        break;
      default:
    }
  };

  const handleClick: React.MouseEventHandler = e => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else {
      chipRef.current!.focus();
    }
  };

  const sizeStyle = sizeClassNames(props);

  let adornment =
    invalid || errorMessage != null ? (
      <WarningIcon className="text-danger" size="sm" />
    ) : (
      props.adornment &&
      cloneElement(props.adornment, {
        size: sizeStyle.adornment.size,
        className: clsx(
          props.adornment.props.className,
          sizeStyle.adornment.margin,
        ),
      })
    );

  if (errorMessage && adornment) {
    adornment = (
      <Tooltip label={errorMessage} variant="danger">
        {adornment}
      </Tooltip>
    );
  }

  const Element = elementType;

  return (
    <Element
      tabIndex={selectable ? 0 : undefined}
      ref={chipRef}
      to={to}
      onKeyDown={selectable ? handleKeyDown : undefined}
      onClick={selectable ? handleClick : undefined}
      className={clsx(
        'relative flex max-w-full flex-shrink-0 items-center justify-center gap-10 overflow-hidden whitespace-nowrap outline-none transition-opacity',
        'w-max min-w-0 after:pointer-events-none after:absolute after:inset-0',
        onClick && 'cursor-pointer',
        radius,
        colorClassName(props),
        sizeStyle.chip,
        !disabled &&
          selectable &&
          'hover:after:bg-black/5 focus:after:bg-black/10',
        className,
        disabled && 'pointer-events-none opacity-70',
      )}
    >
      {adornment}
      <div className="flex-auto overflow-hidden overflow-ellipsis">
        {children}
      </div>
      {onRemove && (
        <ButtonBase
          ref={deleteButtonRef}
          className={clsx(
            'flex-shrink-0 text-black/30 dark:text-white/50',
            sizeStyle.closeButton,
          )}
          onClick={e => {
            e.stopPropagation();
            onRemove();
          }}
          tabIndex={-1}
        >
          <CancelFilledIcon className="block" width="100%" height="100%" />
        </ButtonBase>
      )}
    </Element>
  );
}

function sizeClassNames({size, onRemove, fontWeight}: ChipProps) {
  switch (size) {
    case 'xs':
      return {
        adornment: {size: 'xs', margin: '-ml-3'},
        chip: clsx(
          'pl-8 h-20 text-xs w-max',
          fontWeight ?? 'font-medium',
          !onRemove && 'pr-8',
        ),
        closeButton: 'mr-4 w-14 h-14',
      };
    case 'sm':
      return {
        adornment: {size: 'xs', margin: '-ml-3'},
        chip: clsx('pl-8 h-26 text-xs', fontWeight, !onRemove && 'pr-8'),
        closeButton: 'mr-4 w-18 h-18',
      };
    case 'lg':
      return {
        adornment: {size: 'md', margin: '-ml-12'},
        chip: clsx('pl-18 h-38 text-base', fontWeight, !onRemove && 'pr-18'),
        closeButton: 'mr-6 w-24 h-24',
      };
    default:
      return {
        adornment: {size: 'sm', margin: '-ml-6'},
        chip: clsx('pl-12 h-32 text-sm', fontWeight, !onRemove && 'pr-12'),
        closeButton: 'mr-6 w-22 h-22',
      };
  }
}

function colorClassName({color}: ChipProps): string {
  switch (color) {
    case 'primary':
      return `bg-primary text-on-primary`;
    case 'positive':
      return `bg-positive-lighter text-positive-darker`;
    case 'danger':
      return `bg-danger-lighter text-danger-darker`;
    default:
      return `bg-chip text-main`;
  }
}
