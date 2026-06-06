import {FocusScope} from '@react-aria/focus';
import {useObjectRef} from '@react-aria/utils';
import {OverlayProps} from '@ui/overlays/overlay-props';
import {Underlay} from '@ui/overlays/underlay';
import {useOverlayViewport} from '@ui/overlays/use-overlay-viewport';
import {m} from 'framer-motion';
import {forwardRef} from 'react';

export const Drawer = forwardRef<HTMLDivElement, OverlayProps>(
  (
    {
      children,
      autoFocus = false,
      restoreFocus = true,
      isDismissable,
      underlayBlurred,
      underlayTransparent,
      isOpen,
      onClose,
    },
    ref,
  ) => {
    const viewPortStyle = useOverlayViewport();
    const objRef = useObjectRef(ref);

    return (
      <div className="fixed inset-0 isolate z-drawer" style={viewPortStyle}>
        <Underlay
          key="drawer-underlay"
          isBlurred={underlayBlurred ?? false}
          isTransparent={underlayTransparent ?? false}
          onClick={() => {
            if (isDismissable) {
              onClose();
            }
          }}
        />
        <m.div
          ref={objRef}
          className="absolute bottom-8 right-8 top-8 z-20"
          role="presentation"
          initial={{x: '100%', opacity: 0}}
          animate={{x: 0, opacity: 1}}
          exit={{x: '100%', opacity: 0}}
          transition={{type: 'tween', duration: 0.14}}
        >
          <FocusScope restoreFocus={restoreFocus} autoFocus={autoFocus} contain>
            {children}
          </FocusScope>
        </m.div>
      </div>
    );
  },
);
