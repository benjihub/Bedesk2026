import {FocusScope, useFocusManager} from '@react-aria/focus';
import {ListItemBase, ListItemBaseProps} from '@ui/list/list-item-base';
import clsx from 'clsx';
import React, {forwardRef, ReactElement, ReactNode, useState} from 'react';

type Child = ReactElement<ListItemProps> | ReactElement<ListItemProps>[];

interface Props {
  className?: string;
  padding?: string;
  children: ReactNode;
  dataTestId?: string;
  listRef?: React.RefObject<HTMLUListElement>;
}

export function List({
  children,
  className,
  padding,
  dataTestId,
  listRef,
}: Props) {
  return (
    <FocusScope>
      <ul
        ref={listRef}
        data-testid={dataTestId}
        className={clsx(
          'text-base outline-none sm:text-sm',
          className,
          padding ?? 'py-4',
        )}
      >
        {children}
      </ul>
    </FocusScope>
  );
}

interface ListItemProps extends ListItemBaseProps {
  children: ReactNode;
  onSelected?: () => void;
  borderRadius?: string;
}
export const ListItem = forwardRef<HTMLDivElement, ListItemProps>(
  (
    {
      children,
      onSelected,
      borderRadius = 'rounded',
      className,
      ...listItemProps
    },
    ref,
  ) => {
    const focusManager = useFocusManager();
    const isSelectable = !!onSelected;
    const [isActive, setIsActive] = useState(false);

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          focusManager?.focusNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          focusManager?.focusPrevious();
          break;
        case 'Home':
          e.preventDefault();
          focusManager?.focusFirst();
          break;
        case 'End':
          e.preventDefault();
          focusManager?.focusLast();
          break;
        case 'Enter':
        case 'Space':
          e.preventDefault();
          onSelected?.();
          break;
      }
    };

    return (
      <li>
        <ListItemBase
          className={clsx(className, borderRadius)}
          isActive={isActive}
          isDisabled={listItemProps.isDisabled}
          {...listItemProps}
          onFocus={e => {
            setIsActive((e.target as HTMLElement).matches(':focus-visible'));
          }}
          onBlur={() => {
            setIsActive(false);
          }}
          onClick={() => {
            onSelected?.();
          }}
          ref={ref}
          role={isSelectable ? 'button' : undefined}
          onKeyDown={isSelectable ? onKeyDown : undefined}
          tabIndex={isSelectable && !listItemProps.isDisabled ? 0 : undefined}
        >
          {children}
        </ListItemBase>
      </li>
    );
  },
);
