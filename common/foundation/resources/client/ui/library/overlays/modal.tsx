import {FocusScope} from '@react-aria/focus';
import {useObjectRef} from '@react-aria/utils';
import clsx from 'clsx';
import {m} from 'framer-motion';
import {forwardRef} from 'react';
import {OverlayProps} from './overlay-props';
import {Underlay} from './underlay';
import {useOverlayViewport} from './use-overlay-viewport';

export const Modal = forwardRef<HTMLDivElement, OverlayProps>(
  (
    {
      children,
      autoFocus = false,
      restoreFocus = true,
      isDismissable = true,
      isOpen = false,
      placement = 'center',
      underlayTransparent,
      underlayBlurred,
      position,
      onClose,
    },
    ref,
  ) => {
    const viewPortStyle = useOverlayViewport();
    const objRef = useObjectRef(ref);

    return (
      <div
        className={clsx(
          'inset-0 isolate z-modal',
          position === 'absolute' ? 'absolute' : 'fixed',
        )}
        style={viewPortStyle}
        onKeyDown={e => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }
        }}
      >
        <Underlay
          key="modal-underlay"
          isTransparent={underlayTransparent}
          isBlurred={underlayBlurred}
          position={position}
          onClick={() => {
            if (isDismissable) {
              onClose();
            }
          }}
        />
        <m.div
          ref={objRef}
          className={clsx(
            'pointer-events-none absolute inset-0 z-20 flex h-full w-full',
            placement === 'center' && 'items-center justify-center',
            placement === 'top' && 'items-start justify-center pt-40',
          )}
          role="presentation"
          initial={{opacity: 0, scale: placement === 'top' ? 1 : 0.7}}
          animate={{opacity: 1, scale: 1}}
          exit={{opacity: 0, scale: 1}}
          transition={{duration: 0.1}}
        >
          <FocusScope restoreFocus={restoreFocus} autoFocus={autoFocus} contain>
            {children}
          </FocusScope>
        </m.div>
      </div>
    );
  },
);
