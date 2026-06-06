import { ButtonSize } from '@ui/buttons/button-size';
import { IconButton } from '@ui/buttons/icon-button';
import { CloseIcon } from '@ui/icons/material/Close';
import clsx from 'clsx';
import { ReactElement, ReactNode, useContext } from 'react';
import { DialogSize } from './dialog';
import { DialogContext, DialogType, useDialogContext } from './dialog-context';

interface DialogHeaderProps {
  children: ReactNode;
  className?: string;
  color?: string | null;
  onDismiss?: () => void;
  hideDismissButton?: boolean;
  disableDismissButton?: boolean;
  leftAdornment?: ReactNode;
  // Will hide default close button visually, but still accessible by screen readers
  rightAdornment?: ReactNode;
  // Will show between title and close button
  closeButtonIcon?: ReactElement;
  actions?: ReactNode;
  size?: DialogSize;
  padding?: string;
  justify?: string;
  showDivider?: boolean;
  titleTextSize?: string;
  titleFontWeight?: string;
  closeButtonSize?: ButtonSize;
}
export function DialogHeader(props: DialogHeaderProps) {
  const {type} = useDialogContext();
  const defaultTextSize = type === 'drawer' ? 'text-lg' : 'text-base';
  const {
    children,
    className,
    color,
    onDismiss,
    leftAdornment,
    rightAdornment,
    hideDismissButton = false,
    disableDismissButton = false,
    size,
    showDivider,
    justify = 'justify-between',
    titleFontWeight = 'font-semibold',
    titleTextSize = size === 'xs' ? 'text-xs' : defaultTextSize,
    closeButtonSize = size === 'xs' ? 'xs' : 'sm',
    actions,
    closeButtonIcon,
  } = props;
  const {labelId, isDismissable, close} = useContext(DialogContext);

  return (
    <div
      className={clsx(
        className,
        'flex flex-shrink-0 items-center gap-10',
        titleFontWeight,
        showDivider && 'border-b',
        getPadding(type, props),
        color || 'text-main',
        justify,
      )}
    >
      {leftAdornment}
      <h3 id={labelId} className={clsx(titleTextSize, 'mr-auto leading-6')}>
        {children}
      </h3>
      {rightAdornment}
      {actions}
      {isDismissable && !hideDismissButton && (
        <IconButton
          aria-label="Dismiss"
          size="2xs"
          iconSize={closeButtonSize}
          disabled={disableDismissButton}
          onClick={() => {
            if (onDismiss) {
              onDismiss();
            } else {
              close();
            }
          }}
          className={clsx('text-muted', rightAdornment && 'sr-only')}
        >
          {closeButtonIcon || <CloseIcon />}
        </IconButton>
      )}
    </div>
  );
}

function getPadding(type: DialogType, {size, padding}: DialogHeaderProps) {
  if (padding) {
    return padding;
  }

  if (type === 'drawer') {
    return 'px-24 pt-16';
  }

  switch (size) {
    case '2xs':
    case 'xs':
      return 'px-14 py-10';
    case 'sm':
      return 'p-18';
    default:
      return 'px-24 py-16';
  }
}
