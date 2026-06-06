import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {Listbox} from '@ui/forms/listbox/listbox';
import {Section} from '@ui/forms/listbox/section';
import {ListBoxChildren, ListboxProps} from '@ui/forms/listbox/types';
import {useListbox} from '@ui/forms/listbox/use-listbox';
import {useListboxKeyboardNavigation} from '@ui/forms/listbox/use-listbox-keyboard-navigation';
import {useTypeSelect} from '@ui/forms/listbox/use-type-select';
import {SearchIcon} from '@ui/icons/material/Search';
import {createEventHandler} from '@ui/utils/dom/create-event-handler';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import React, {cloneElement, forwardRef, ReactElement, useId} from 'react';

export type MenuTriggerProps = ListboxProps & {
  dontBindEventsToTrigger?: boolean;
  searchPlaceholder?: string;
  showSearchField?: boolean;
  children: [ReactElement<any>, ReactElement<ListBoxChildren<string | number>>];
  placement?: ListboxProps['placement'];
  offset?: ListboxProps['offset'];
};
export const MenuTrigger = forwardRef<HTMLButtonElement, MenuTriggerProps>(
  (props, ref) => {
    const {
      placement,
      offset,
      searchPlaceholder,
      showSearchField,
      children: [menuTrigger, menu],
      floatingWidth = 'auto',
      isLoading,
      dontBindEventsToTrigger,
    } = props;

    const id = useId();

    const isMobile = useIsMobileMediaQuery();
    const listbox = useListbox(
      {
        ...props,
        clearInputOnItemSelection: true,
        showEmptyMessage: showSearchField,
        // on mobile menu will be shown as bottom drawer, so make it fullscreen width always
        floatingWidth: isMobile ? 'auto' : floatingWidth,
        virtualFocus: showSearchField,
        role: showSearchField ? 'listbox' : 'menu',
        focusLoopingMode: showSearchField ? 'stay' : 'loop',
        children: menu.props.children,
        placement,
        offset,
      },
      ref,
    );

    const {
      state: {isOpen, setIsOpen, activeIndex, inputValue, setInputValue},
      listboxId,
      focusItem,
      listContent,
      reference,
      onInputChange,
    } = listbox;

    const {
      handleTriggerKeyDown,
      handleListboxKeyboardNavigation,
      handleListboxSearchFieldKeydown,
    } = useListboxKeyboardNavigation(listbox);
    const {findMatchingItem} = useTypeSelect();

    // focus matching item when user types, if dropdown is open
    const handleListboxTypeSelect = (e: React.KeyboardEvent) => {
      if (!isOpen) return;
      const i = findMatchingItem(e, listContent, activeIndex);
      if (i != null) {
        focusItem('increment', i);
      }
    };

    return (
      <Listbox
        onClick={e => e.stopPropagation()}
        listbox={listbox}
        onKeyDownCapture={
          !showSearchField ? handleListboxTypeSelect : undefined
        }
        onKeyDown={handleListboxKeyboardNavigation}
        onClose={showSearchField ? () => setInputValue('') : undefined}
        aria-labelledby={id}
        isLoading={isLoading}
        searchField={
          showSearchField ? (
            <TextField
              size="sm"
              placeholder={searchPlaceholder}
              startAdornment={<SearchIcon />}
              className="flex-shrink-0 px-8 pb-8 pt-4"
              autoFocus
              aria-expanded={isOpen ? 'true' : 'false'}
              aria-haspopup="listbox"
              aria-controls={isOpen ? listboxId : undefined}
              aria-autocomplete="list"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              value={inputValue}
              onChange={onInputChange}
              onKeyDown={e => {
                handleListboxSearchFieldKeydown(e);
              }}
            />
          ) : null
        }
      >
        {cloneElement(menuTrigger, {
          id,
          'aria-expanded': isOpen ? 'true' : 'false',
          'aria-haspopup': 'menu',
          'aria-controls': isOpen ? listboxId : undefined,
          ref: reference,
          onKeyDown: dontBindEventsToTrigger ? undefined : handleTriggerKeyDown,
          onClick: dontBindEventsToTrigger
            ? undefined
            : createEventHandler(e => {
                menuTrigger.props?.onClick?.(e);
                setIsOpen(!isOpen);
              }),
        })}
      </Listbox>
    );
  },
);

export function Menu({children}: ListBoxChildren<string | number>) {
  return children as unknown as ReactElement;
}

export {Item as MenuItem, Section as MenuSection};
