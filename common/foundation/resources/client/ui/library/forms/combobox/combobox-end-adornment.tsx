import {useListboxContext} from '@ui/forms/listbox/listbox-context';
import {useTrans} from '@ui/i18n/use-trans';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {ReactElement, useEffect, useRef, useState} from 'react';

interface Props {
  isLoading?: boolean;
  icon?: ReactElement<SvgIconProps>;
  size?: string;
}
export function ComboboxEndAdornment({isLoading, icon, size}: Props) {
  const timeout = useRef<any>(null);
  const {trans} = useTrans();
  const [showLoading, setShowLoading] = useState(false);

  const {
    state: {isOpen, inputValue},
  } = useListboxContext();

  const lastInputValue = useRef(inputValue);
  useEffect(() => {
    if (isLoading && !showLoading) {
      if (timeout.current === null) {
        timeout.current = setTimeout(() => {
          setShowLoading(true);
        }, 500);
      }

      // If user is typing, clear the timer and restart since it is a new request
      if (inputValue !== lastInputValue.current) {
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
          setShowLoading(true);
        }, 500);
      }
    } else if (!isLoading) {
      // If loading is no longer happening, clear any timers and hide the loading circle
      setShowLoading(false);
      clearTimeout(timeout.current);
      timeout.current = null;
    }

    lastInputValue.current = inputValue;
  }, [isLoading, showLoading, inputValue]);

  // loading circle should only be displayed if menu is open, if menuTrigger is "manual", or first time load (to stop circle from showing up when user selects an option)
  const showLoadingIndicator = showLoading && (isOpen || isLoading);

  if (showLoadingIndicator) {
    return (
      <ProgressCircle
        aria-label={trans({message: 'Loading'})}
        size="w-24 h-24"
        isIndeterminate
      />
    );
  }

  return icon || <KeyboardArrowDownIcon size={size} />;
}
