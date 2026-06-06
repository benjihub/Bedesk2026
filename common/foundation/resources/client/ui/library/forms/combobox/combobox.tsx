import {IconButton} from '@ui/buttons/icon-button';
import {ComboboxEndAdornment} from '@ui/forms/combobox/combobox-end-adornment';
import {BaseFieldPropsWithDom} from '@ui/forms/input-field/base-field-props';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {Listbox} from '@ui/forms/listbox/listbox';
import {ListBoxChildren, ListboxProps} from '@ui/forms/listbox/types';
import {useListbox} from '@ui/forms/listbox/use-listbox';
import {useListboxKeyboardNavigation} from '@ui/forms/listbox/use-listbox-keyboard-navigation';
import {SvgIconProps} from '@ui/icons/svg-icon';
import {Popover} from '@ui/overlays/popover';
import {createEventHandler} from '@ui/utils/dom/create-event-handler';
import React, {ReactElement, Ref} from 'react';

export {Item as Option};

export type ComboboxProps<T extends object> = Omit<
  BaseFieldPropsWithDom<HTMLInputElement>,
  'endAdornment'
> &
  ListBoxChildren<T> &
  ListboxProps & {
    selectionMode?: 'single' | 'none';
    isAsync?: boolean;
    isLoading?: boolean;
    isFetching?: boolean;
    openMenuOnFocus?: boolean;
    endAdornmentIcon?: ReactElement<SvgIconProps>;
    useOptionLabelAsInputValue?: boolean;
    hideEndAdornment?: boolean;
    onEndAdornmentClick?: () => void;
    prependListbox?: boolean;
    listboxClassName?: string;
    contentClassName?: string;
    searchFieldClassName?: string;
  };

function ComboBox<T extends object>(
  props: ComboboxProps<T> & {selectionMode: 'single'},
  ref: Ref<HTMLInputElement>,
) {
  const {
    children,
    items,
    isAsync,
    isLoading,
    isPending,
    isFetching,
    openMenuOnFocus = true,
    endAdornmentIcon,
    onItemSelected,
    maxItems,
    clearInputOnItemSelection,
    inputValue: userInputValue,
    selectedValue,
    onSelectionChange,
    allowCustomValue = false,
    onInputValueChange,
    defaultInputValue,
    selectionMode = 'single',
    useOptionLabelAsInputValue,
    showEmptyMessage,
    floatingMaxHeight,
    hideEndAdornment = false,
    blurReferenceOnItemSelection,
    clearSelectionOnInputClear,
    isOpen: propsIsOpen,
    onOpenChange: propsOnOpenChange,
    prependListbox,
    listboxClassName,
    contentClassName,
    searchFieldClassName,
    onEndAdornmentClick,
    autoFocusFirstItem = true,
    focusLoopingMode,
    ...textFieldProps
  } = props;

  const listbox = useListbox(
    {
      ...props,
      floatingMaxHeight,
      blurReferenceOnItemSelection,
      selectionMode,
      role: 'listbox',
      virtualFocus: true,
      clearSelectionOnInputClear: true,
    },
    ref,
  );

  const {
    reference,
    listboxId,
    onInputChange,
    state: {
      isOpen,
      setIsOpen,
      inputValue,
      setInputValue,
      selectValues,
      selectedValues,
      setActiveCollection,
    },
    collection,
  } = listbox;

  const textLabel = selectedValues[0]
    ? collection.get(selectedValues[0])?.textLabel
    : undefined;

  const {handleListboxSearchFieldKeydown} =
    useListboxKeyboardNavigation(listbox);

  const handleFocusAndClick = createEventHandler(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (openMenuOnFocus && !isOpen) {
        setIsOpen(true);
      }
      e.target.select();
    },
  );

  return (
    <Listbox
      prepend={prependListbox}
      className={listboxClassName}
      contentClassName={contentClassName}
      listbox={listbox}
      mobileOverlay={Popover}
      isLoading={isLoading}
      isPending={isPending}
      onPointerDown={e => {
        // prevent focus from leaving input when scrolling listbox via mouse
        e.preventDefault();
      }}
    >
      <TextField
        inputRef={reference}
        className={searchFieldClassName}
        {...textFieldProps}
        endAdornment={
          !hideEndAdornment ? (
            <IconButton
              size="md"
              tabIndex={-1}
              disabled={textFieldProps.disabled}
              className="pointer-events-auto"
              onPointerDown={e => {
                e.preventDefault();
                e.stopPropagation();
                if (onEndAdornmentClick) {
                  onEndAdornmentClick();
                } else {
                  setActiveCollection('all');
                  setIsOpen(!isOpen);
                }
              }}
            >
              <ComboboxEndAdornment
                isLoading={isLoading || isFetching}
                icon={endAdornmentIcon}
              />
            </IconButton>
          ) : null
        }
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listboxId : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        onChange={onInputChange}
        value={useOptionLabelAsInputValue && textLabel ? textLabel : inputValue}
        onBlur={e => {
          if (allowCustomValue) {
            selectValues(e.target.value);
          } else if (!clearInputOnItemSelection) {
            const val = selectedValues[0];
            setInputValue(selectValues.length && val != null ? `${val}` : '');
          }
        }}
        onFocus={handleFocusAndClick}
        onClick={handleFocusAndClick}
        onKeyDown={e => handleListboxSearchFieldKeydown(e)}
      />
    </Listbox>
  );
}

const ComboBoxForwardRef = React.forwardRef(ComboBox) as <T extends object>(
  props: ComboboxProps<T> & {ref?: Ref<HTMLInputElement>},
) => ReactElement;
export {ComboBoxForwardRef as ComboBox};
