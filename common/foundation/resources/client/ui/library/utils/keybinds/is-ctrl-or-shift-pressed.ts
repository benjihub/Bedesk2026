import {isCtrlKeyPressed} from '@ui/utils/keybinds/is-ctrl-key-pressed';

interface Event {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

export function isCtrlOrShiftPressed(e: Event) {
  return e.shiftKey || isCtrlKeyPressed(e);
}
