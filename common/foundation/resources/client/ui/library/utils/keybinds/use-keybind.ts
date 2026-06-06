import {useGlobalListeners} from '@react-aria/utils';
import {isAnyInputFocused} from '@ui/utils/dom/is-any-input-focused';
import {useCallbackRef} from '@ui/utils/hooks/use-callback-ref';
import {isCtrlKeyPressed} from '@ui/utils/keybinds/is-ctrl-key-pressed';
import {useEffect} from 'react';

interface Options {
  allowedInputSelector?: string;
}

export function useKeybind(
  el: HTMLElement | 'window',
  shortcut: string,
  userCallback: (e: KeyboardEvent) => void,
  {allowedInputSelector}: Options = {},
) {
  const {addGlobalListener, removeAllGlobalListeners} = useGlobalListeners();
  const callback = useCallbackRef(userCallback);

  useEffect(() => {
    const target = el === 'window' ? window : el;
    addGlobalListener(target, 'keydown', (e: KeyboardEvent) => {
      if (!shouldIgnoreActiveEl(allowedInputSelector) && isAnyInputFocused()) {
        return;
      }
      const matches = shortcut.split('+').every(key => {
        if (key === 'plus') key = '+';
        key = key.toLowerCase();
        if (key === 'ctrl') {
          return isCtrlKeyPressed(e);
        } else {
          return e.key.toLowerCase() === key;
        }
      });
      if (matches) {
        e.preventDefault();
        e.stopPropagation();
        callback(e);
      }
    });
    return removeAllGlobalListeners;
  }, [
    addGlobalListener,
    shortcut,
    removeAllGlobalListeners,
    callback,
    el,
    allowedInputSelector,
  ]);
}

function shouldIgnoreActiveEl(selector?: string) {
  if (!selector || !document.activeElement) {
    return false;
  }
  return (document.activeElement as HTMLElement).closest(selector);
}
