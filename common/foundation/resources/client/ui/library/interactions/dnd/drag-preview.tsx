import { rootEl } from '@ui/root-el';
import React, { ReactElement, useImperativeHandle, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { ConnectedDraggable, DragPreviewRenderer } from './use-draggable';

export interface DragPreviewProps {
  children: (draggable: ConnectedDraggable) => ReactElement;
}
export const DragPreview = React.forwardRef<
  DragPreviewRenderer,
  DragPreviewProps
>((props, ref) => {
  const render = props.children;
  const [children, setChildren] = useState<ReactElement | null>(null);
  const domRef = useRef<HTMLDivElement>(null!);

  useImperativeHandle(
    ref,
    () =>
      (
        draggable: ConnectedDraggable,
        callback: (node: HTMLElement) => void,
      ) => {
        // This will be called during the onDragStart event by useDrag. We need to render the
        // preview synchronously before this event returns, so we can call event.dataTransfer.setDragImage.
        flushSync(() => {
          setChildren(render(draggable));
        });

        // Yield back to useDrag to set the drag image.
        callback(domRef.current);

        // Remove the preview from the DOM after a frame so the browser has time to paint.
        requestAnimationFrame(() => {
          setChildren(null);
        });
      },
    [render],
  );

  if (!children) {
    return null;
  }

  // portal preview, in case in needs to be used in <tr> or another element that does not accept div as child
  return createPortal(
    <div
      style={{zIndex: -100, position: 'absolute', top: 0, left: -100000}}
      ref={domRef}
    >
      {children}
    </div>,
    rootEl,
  );
});
