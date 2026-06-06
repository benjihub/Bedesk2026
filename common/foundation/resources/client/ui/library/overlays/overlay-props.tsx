import { Placement, VirtualElement } from '@floating-ui/react-dom';
import { FocusScopeProps } from '@react-aria/focus';
import {
  CSSProperties,
  PointerEventHandler,
  ReactElement,
  Ref,
  RefObject,
} from 'react';

export interface OverlayProps
  extends Omit<FocusScopeProps, 'children' | 'contain'> {
  children: ReactElement;
  style?: CSSProperties;
  isDismissable: boolean;
  isContextMenu?: boolean;
  isOpen: boolean;
  onClose: (value?: any) => void;
  triggerRef: RefObject<HTMLElement | VirtualElement | null>;
  arrowRef?: Ref<HTMLElement>;
  arrowStyle?: CSSProperties;
  onPointerLeave?: PointerEventHandler<HTMLElement>;
  onPointerEnter?: PointerEventHandler<HTMLElement>;
  placement?: Placement;
  underlayTransparent?: boolean;
  underlayBlurred?: boolean;
  position?: 'fixed' | 'absolute';
}
