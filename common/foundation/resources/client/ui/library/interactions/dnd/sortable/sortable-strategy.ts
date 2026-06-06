import type {
  DropPosition,
  SortSession,
} from '@ui/interactions/dnd/sortable/use-sortable';
import { DraggableId } from '@ui/interactions/dnd/use-draggable';
import { DragEvent, RefObject } from 'react';

interface OnDragOverProps {
  e: DragEvent<HTMLElement>;
  ref: RefObject<HTMLElement | null>;
  item: DraggableId;
  sortSession: SortSession;
  onDropPositionChange?: (dropPosition: DropPosition) => void;
}

export interface SortableStrategy {
  onDragStart: (sortSession: SortSession) => void;
  onDragEnter: (
    sortSession: SortSession,
    overIndex: number,
    currentIndex: number,
  ) => void;
  onDragOver: (props: OnDragOverProps) => void;
  onDragEnd: (sortSession: SortSession) => void;
}
