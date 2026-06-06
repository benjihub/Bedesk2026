import {m} from 'framer-motion';
import {forwardRef} from 'react';
import {FocusScope} from '@react-aria/focus';
import {useObjectRef} from '@react-aria/utils';
import {OverlayProps} from '@ui/overlays/overlay-props';
import {useOverlayViewport} from '@ui/overlays/use-overlay-viewport';
import {Underlay} from '@ui/overlays/underlay';

export const Tray = forwardRef<HTMLDivElement, OverlayProps>(
  (
    {
      children,
      autoFocus = false,
      restoreFocus = true,
      isDismissable,
      isOpen,
      onClose,
    },
    ref,
  ) => {
    const viewPortStyle = useOverlayViewport();
    const objRef = useObjectRef(ref);

    return (
      <div className="fixed inset-0 isolate z-tray" style={viewPortStyle}>
        <Underlay
          key="tray-underlay"
          onClick={() => {
            if (isDismissable) {
              onClose();
            }
          }}
        />
        <m.div
          ref={objRef}
          className="absolute bottom-0 left-0 right-0 z-20 mx-auto max-h-tray w-full max-w-375 overflow-hidden rounded-t pb-safe-area"
          role="presentation"
          initial={{opacity: 0, y: '100%'}}
          animate={{opacity: 1, y: 0}}
          exit={{opacity: 0, y: '100%'}}
          transition={{type: 'tween', duration: 0.2}}
        >
          <FocusScope restoreFocus={restoreFocus} autoFocus={autoFocus} contain>
            {children}
          </FocusScope>
        </m.div>
      </div>
    );
  },
);
