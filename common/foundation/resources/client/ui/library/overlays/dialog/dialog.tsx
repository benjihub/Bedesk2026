import {mergeProps} from '@react-aria/utils';
import clsx from 'clsx';
import {
  Children,
  cloneElement,
  ComponentPropsWithoutRef,
  CSSProperties,
  isValidElement,
  ReactElement,
  ReactNode,
  useContext,
} from 'react';
import {InputSize} from '../../forms/input-field/input-size';
import {DialogContext} from './dialog-context';
import {DismissButton} from './dismiss-button';

export type DialogSize =
  | InputSize
  | '2xl'
  | 'auto'
  | 'fullscreen'
  | 'fullscreenTakeover'
  | string;

export interface DialogProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'size'> {
  children: ReactNode;
  size?: DialogSize;
  background?: string;
  className?: string;
  radius?: string;
  maxWidth?: string;
  maxHeight?: string;
  shadow?: string;
}

export function Dialog(props: DialogProps) {
  const {
    type = 'modal',
    dialogProps,
    ...contextProps
  } = useContext(DialogContext);

  const {
    children,
    className,
    size = 'md',
    background,
    radius = 'rounded-panel',
    maxWidth = 'max-w-dialog',
    maxHeight = 'max-h-dialog',
    shadow = 'shadow-2xl',
    ...domProps
  } = props;

  // If rendered in a popover or tray there won't be a visible dismiss button,
  // so we render a hidden one for screen readers.
  let dismissButton: ReactElement | null = null;
  if (type === 'popover' || type === 'tray') {
    dismissButton = <DismissButton onDismiss={contextProps.close} />;
  }

  const isTrayOrFullScreen = size === 'fullscreenTakeover' || type === 'tray';
  const mergedClassName = clsx(
    'mx-auto pointer-events-auto outline-none flex flex-col overflow-hidden',
    background || 'bg-elevated',
    type === 'drawer' && 'h-full',
    type !== 'tray' && sizeStyle(size),
    type === 'tray' && 'rounded-t border-b-bg',
    size !== 'fullscreenTakeover' && `${shadow} border`,
    size !== 'fullscreenTakeover' && type !== 'drawer' && maxHeight,
    !isTrayOrFullScreen && `${radius} ${maxWidth}`,
    className,
  );

  return (
    <div
      {...mergeProps({role: 'dialog', tabIndex: -1}, dialogProps, domProps)}
      style={{...props.style, '--be-dialog-padding': '24px'} as CSSProperties}
      aria-modal
      className={mergedClassName}
    >
      {Children.toArray(children).map(child => {
        if (isValidElement<DialogProps>(child)) {
          return cloneElement<DialogProps>(child, {
            size: child.props.size ?? size,
          });
        }
        return child;
      })}
      {dismissButton}
    </div>
  );
}

function sizeStyle(dialogSize?: DialogSize) {
  switch (dialogSize) {
    case '2xs':
      return 'w-256';
    case 'xs':
      return 'w-320';
    case 'sm':
      return 'w-384';
    case 'md':
      return 'w-440';
    case 'lg':
      return 'w-620';
    case 'xl':
      return 'w-780';
    case '2xl':
      return 'w-850';
    case 'fullscreen':
      return 'w-1280';
    case 'fullscreenTakeover':
      return 'w-full h-full';
    default:
      return dialogSize;
  }
}
