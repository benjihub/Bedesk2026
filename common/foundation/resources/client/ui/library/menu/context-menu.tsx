import { VirtualElement } from '@floating-ui/react-dom';
import { Listbox } from '@ui/forms/listbox/listbox';
import { ListBoxChildren, ListboxProps } from '@ui/forms/listbox/types';
import { useListbox } from '@ui/forms/listbox/use-listbox';
import { useListboxKeyboardNavigation } from '@ui/forms/listbox/use-listbox-keyboard-navigation';
import { useTypeSelect } from '@ui/forms/listbox/use-type-select';
import { Menu } from '@ui/menu/menu-trigger';
import { ReactElement, useEffect } from 'react';

const preventContextOnMenu = (e: MouseEvent) => {
  e.preventDefault();
};

type Props = ListboxProps &
  ListBoxChildren<any> & {
    position?: {x: number; y: number} | null;
  };

export function ContextMenu({position, children, ...props}: Props) {
  const listbox = useListbox({
    ...props,
    isOpen: props.isOpen && !!position,
    placement: 'right-start',
    floatingWidth: 'auto',
    role: 'menu',
    focusLoopingMode: 'loop',
    children:
      (children as ReactElement)?.type === Menu
        ? (children as ReactElement<ListBoxChildren<any>>).props.children
        : children,
  });
  const {
    reference,
    refs,
    state: {isOpen, setIsOpen, activeIndex},
    focusItem,
    listContent,
  } = listbox;

  useEffect(() => {
    if (refs.floating.current) {
      refs.floating.current.addEventListener(
        'contextmenu',
        preventContextOnMenu,
      );
      return () => {
        refs.floating.current?.removeEventListener(
          'contextmenu',
          preventContextOnMenu,
        );
      };
    }
  }, [refs.floating]);

  useEffect(() => {
    if (position) {
      reference(pointToVirtualElement(position));
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [position, reference, setIsOpen]);

  const {handleListboxKeyboardNavigation} =
    useListboxKeyboardNavigation(listbox);

  const {findMatchingItem} = useTypeSelect();

  return (
    <Listbox
      listbox={listbox}
      onKeyDownCapture={e => {
        if (!isOpen) return;
        const i = findMatchingItem(e, listContent, activeIndex);
        if (i) {
          focusItem('increment', i);
        }
      }}
      onKeyDown={handleListboxKeyboardNavigation}
    />
  );
}

export function pointToVirtualElement(
  {x, y}: {x: number; y: number},
  contextElement?: Element,
): VirtualElement {
  return {
    getBoundingClientRect() {
      return {
        x,
        y,
        width: 0,
        height: 0,
        top: y,
        right: x,
        bottom: y,
        left: x,
      };
    },
    contextElement,
  };
}
