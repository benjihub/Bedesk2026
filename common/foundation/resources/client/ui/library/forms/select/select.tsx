import {mergeProps} from '@react-aria/utils';
import {ComboboxEndAdornment} from '@ui/forms/combobox/combobox-end-adornment';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {useDefaultValidationRules} from '@ui/forms/use-default-validation-rules';
import {Trans} from '@ui/i18n/trans';
import {SearchIcon} from '@ui/icons/material/Search';
import {useIsMobileDevice} from '@ui/utils/hooks/is-mobile-device';
import clsx from 'clsx';
import React, {Fragment, ReactNode, Ref, RefObject} from 'react';
import {useController} from 'react-hook-form';
import {BaseFieldPropsWithDom} from '../input-field/base-field-props';
import {Field} from '../input-field/field';
import {getInputFieldClassNames} from '../input-field/get-input-field-class-names';
import {useField} from '../input-field/use-field';
import {Item} from '../listbox/item';
import {Listbox} from '../listbox/listbox';
import {Section} from '../listbox/section';
import {ListBoxChildren, ListboxProps, PrimitiveValue} from '../listbox/types';
import {useListbox} from '../listbox/use-listbox';
import {useListboxKeyboardNavigation} from '../listbox/use-listbox-keyboard-navigation';
import {useTypeSelect} from '../listbox/use-type-select';

export type SelectProps<T extends object> = Omit<
  BaseFieldPropsWithDom<HTMLButtonElement>,
  'value'
> &
  ListboxProps &
  ListBoxChildren<T> & {
    hideCaret?: boolean;
    minWidth?: string;
    searchPlaceholder?: string;
    showSearchField?: boolean;
    valueClassName?: string;
    ref?: Ref<HTMLButtonElement>;
    appearance?: 'select' | 'dropdown';
    selectedValue?: PrimitiveValue | null;
    onSelectionChange?: (value: PrimitiveValue) => void;
    defaultSelectedValue?: PrimitiveValue;
  };
export function Select<T extends object>(props: SelectProps<T>) {
  const isMobile = useIsMobileDevice();
  const {
    hideCaret,
    placeholder = <Trans message="Select an option..." />,
    selectedValue,
    onItemSelected,
    onOpenChange,
    onInputValueChange,
    onSelectionChange,
    selectionMode = 'single',
    minWidth = 'min-w-128',
    children,
    searchPlaceholder,
    showEmptyMessage,
    showSearchField,
    defaultInputValue,
    defaultSelectedValue,
    inputValue: userInputValue,
    isLoading,
    isAsync,
    valueClassName,
    floatingWidth = isMobile ? 'auto' : 'matchTrigger',
    ref,
    showCheckmark,
    inputRadius,
    appearance,
    ...inputFieldProps
  } = props;

  const listbox = useListbox(
    {
      ...props,
      selectionMode: selectionMode as any,
      showCheckmark,
      clearInputOnItemSelection: true,
      showEmptyMessage: showEmptyMessage || showSearchField,
      floatingWidth,
      role: 'listbox',
      virtualFocus: showSearchField,
    },
    ref,
  );
  const {
    state: {
      selectedValues,
      isOpen,
      setIsOpen,
      activeIndex,
      setSelectedIndex,
      inputValue,
      setInputValue,
    },
    collections,
    focusItem,
    listboxId,
    reference,
    refs,
    listContent,
    onInputChange,
  } = listbox;

  const {fieldProps, inputProps} = useField({
    ...inputFieldProps,
    focusRef: refs.reference as RefObject<HTMLButtonElement>,
  });

  let selectedContent: ReactNode = (
    <span className="text-main/50">{placeholder}</span>
  );

  if (selectionMode === 'multiple') {
    const selectedOptions = selectedValues
      .map(value => collections.collection.get(value)?.element.props.children)
      .filter(Boolean);
    if (selectedOptions.length > 0) {
      selectedContent = (
        <span className="flex items-center overflow-hidden overflow-ellipsis whitespace-nowrap">
          {selectedOptions.map((child, index) => (
            <Fragment key={index}>
              <div className="block">{child}</div>
              {index < selectedOptions.length - 1 ? (
                <span className="mr-4 block">,</span>
              ) : null}
            </Fragment>
          ))}
        </span>
      );
    }
  } else if (selectionMode === 'single') {
    const selectedOption = collections.collection.get(selectedValues[0]);
    if (selectedOption) {
      selectedContent = (
        <span className="flex items-center gap-10">
          {selectedOption.element.props.startIcon}
          <span
            className={clsx(
              'overflow-hidden overflow-ellipsis whitespace-nowrap',
              valueClassName,
            )}
          >
            {selectedOption.element.props.children}
          </span>
        </span>
      );
    }
  }

  const fieldClassNames = getInputFieldClassNames({
    ...props,
    inputRadius:
      inputRadius ||
      (appearance === 'dropdown' ? 'rounded-button' : 'rounded-input'),
    endAdornment: true,
  });

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

  // select matching item when user types, if dropdown is closed
  const handleTriggerTypeSelect = (e: React.KeyboardEvent) => {
    if (isOpen) return undefined;
    const i = findMatchingItem(e, listContent, activeIndex);
    if (i != null) {
      setSelectedIndex(i);
    }
  };

  return (
    <Listbox
      listbox={listbox}
      onKeyDownCapture={!showSearchField ? handleListboxTypeSelect : undefined}
      onKeyDown={handleListboxKeyboardNavigation}
      onClose={showSearchField ? () => setInputValue('') : undefined}
      isLoading={isLoading}
      searchField={
        showSearchField && (
          <TextField
            size={props.size === 'xs' || props.size === 'sm' ? 'xs' : 'sm'}
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
        )
      }
    >
      <Field
        fieldClassNames={fieldClassNames}
        {...fieldProps}
        endAdornment={
          !hideCaret && (
            <ComboboxEndAdornment isLoading={isLoading} size={props.size} />
          )
        }
      >
        <button
          {...inputProps}
          type="button"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
          ref={reference}
          onKeyDown={handleTriggerKeyDown}
          onKeyDownCapture={
            !showSearchField ? handleTriggerTypeSelect : undefined
          }
          disabled={inputFieldProps.disabled}
          onClick={() => {
            setIsOpen(!isOpen);
          }}
          className={clsx(
            fieldClassNames.input,
            !fieldProps.unstyled && minWidth,
          )}
        >
          {selectedContent}
        </button>
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 w-full opacity-0"
        >
          <label>
            <input
              tabIndex={-1}
              required={props.required}
              name={props.name}
              value={selectedValues[0]}
              onChange={() => {}}
              onFocus={() => {
                if (
                  refs.reference.current &&
                  'focus' in refs.reference.current
                ) {
                  refs.reference.current.focus();
                }
              }}
            />
          </label>
        </div>
      </Field>
    </Listbox>
  );
}

export type FormSelectProps<T extends object> = SelectProps<T> & {
  name: string;
};
export function FormSelect<T extends object>({
  children,
  ...props
}: FormSelectProps<T>) {
  const rules = useDefaultValidationRules(props);
  const {
    field: {onChange, onBlur, value = null, ref},
    fieldState: {invalid, error},
  } = useController({
    name: props.name,
    rules,
  });

  const formProps: Partial<SelectProps<T>> = {
    onSelectionChange: onChange,
    onBlur,
    selectedValue: value,
    invalid,
    errorMessage: error?.message,
    name: props.name,
  };

  // make sure error message is not overridden by undefined or null
  const errorMessage = props.errorMessage || error?.message;
  return (
    <Select ref={ref} {...mergeProps(formProps, props, {errorMessage})}>
      {children}
    </Select>
  );
}

export {Item as Option, Section as OptionGroup};
