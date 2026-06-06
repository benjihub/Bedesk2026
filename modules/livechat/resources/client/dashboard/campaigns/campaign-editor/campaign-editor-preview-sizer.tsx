import {createPortal, flushSync} from 'react-dom';
import React, {
  forwardRef,
  ReactElement,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {rootEl} from '@ui/root-el';
import {CampaignEditorRenderer} from '@livechat/dashboard/campaigns/campaign-editor/campaign-editor-preview-sidebar';

export type CampaignEditorPreviewSizerCallback = (
  cb: (node: HTMLElement) => void,
) => void;

export const CampaignEditorPreviewSizer =
  forwardRef<CampaignEditorPreviewSizerCallback>((_, ref) => {
    const [children, setChildren] = useState<ReactElement | null>(null);
    const domRef = useRef<HTMLDivElement>(null!);

    useImperativeHandle(
      ref,
      () => callback => {
        // Render this synchronously so we can measure size before saving
        flushSync(() => setChildren(<CampaignEditorRenderer />));

        // Yield back to useDrag to set the drag image.
        callback(domRef.current);

        // Remove the preview from the DOM after a frame so the browser has time to paint.
        requestAnimationFrame(() => setChildren(null));
      },
      [],
    );

    if (!children) {
      return null;
    }

    return createPortal(
      <div style={{zIndex: -100, position: 'absolute', top: 0, left: -100000}}>
        <div ref={domRef} className="h-max w-max">
          {children}
        </div>
      </div>,
      rootEl,
    );
  });
