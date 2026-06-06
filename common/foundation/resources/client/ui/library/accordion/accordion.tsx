import {FocusScope, useFocusManager} from '@react-aria/focus';
import {useControlledState} from '@react-stately/utils';
import {AccordionAnimation} from '@ui/accordion/accordtion-animation';
import {ArrowDropDownIcon} from '@ui/icons/material/ArrowDropDown';
import {SvgIconProps} from '@ui/icons/svg-icon';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';
import React, {
  ReactElement,
  ReactNode,
  RefObject,
  cloneElement,
  isValidElement,
  useId,
  useRef,
} from 'react';

type Props = {
  variant?: 'outline' | 'default' | 'minimal';
  children?: ReactNode;
  mode?: 'single' | 'multiple';
  expandedValues?: (string | number)[];
  defaultExpandedValues?: (string | number)[];
  onExpandedChange?: (key: (string | number)[]) => void;
  className?: string;
  isLazy?: boolean;
  gap?: string;
  size?: 'md' | 'lg';
};
export const Accordion = React.forwardRef<HTMLDivElement, Props>(
  (
    {
      variant = 'default',
      mode = 'single',
      children,
      className,
      isLazy,
      gap = 'space-y-10',
      size,
      ...other
    },
    ref,
  ) => {
    const [expandedValues, setExpandedValues] = useControlledState(
      other.expandedValues,
      other.defaultExpandedValues || [],
      other.onExpandedChange,
    );

    const itemsCount = React.Children.count(children);

    return (
      <div
        className={clsx(variant === 'outline' && gap, className)}
        ref={ref}
        role="presentation"
      >
        <AnimatePresence>
          <FocusScope>
            {React.Children.map(children, (child, index) => {
              if (!isValidElement<AccordionItemProps>(child)) return null;
              return cloneElement<AccordionItemProps>(child, {
                key: child.key || index,
                value: child.props.value || index,
                isFirst: index === 0,
                isLast: index === itemsCount - 1,
                mode,
                variant,
                expandedValues,
                setExpandedValues,
                isLazy,
                size,
              });
            })}
          </FocusScope>
        </AnimatePresence>
      </div>
    );
  },
);

export interface AccordionItemProps {
  children: ReactNode;
  disabled?: boolean;
  label: ReactNode;
  description?: ReactNode;
  descriptionClassName?: string;
  value?: string | number;
  isFirst?: boolean;
  isLast?: boolean;
  bodyClassName?: string;
  className?: string;
  bodyPadding?: string;
  labelClassName?: string;
  fontClassName?: string;
  buttonPadding?: string;
  chevronPosition?: 'left' | 'right';
  startIcon?: ReactElement<SvgIconProps>;
  startIconColor?: string;
  endAppend?: ReactElement;
  variant?: 'outline' | 'default' | 'minimal';
  expandedValues?: (string | number)[];
  setExpandedValues?: (keys: (string | number)[]) => void;
  mode?: 'single' | 'multiple';
  size?: Props['size'];
  footerContent?: ReactNode;
  isLazy?: boolean;
  onHeaderMouseEnter?: () => void;
  onHeaderMouseLeave?: () => void;
  onOpen?: () => void;
  ref?: RefObject<HTMLDivElement | null>;
}
export function AccordionItem(props: AccordionItemProps) {
  const {
    children,
    label,
    disabled,
    bodyClassName,
    className,
    bodyPadding = 'p-16',
    labelClassName,
    fontClassName,
    buttonPadding,
    startIcon,
    startIconColor = 'text-muted',
    description,
    descriptionClassName = 'text-xs text-muted',
    endAppend,
    chevronPosition = 'right',
    isFirst,
    mode,
    isLazy,
    size,
    variant,
    footerContent,
    onHeaderMouseEnter,
    onHeaderMouseLeave,
    onOpen,
    ref,
  } = props;
  const expandedValues = props.expandedValues || [];
  const value = props.value || 0;
  const setExpandedValues = props.setExpandedValues || (() => {});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isExpanded = !disabled && expandedValues!.includes(value!);
  const wasExpandedOnce = useRef(false);
  if (isExpanded) {
    wasExpandedOnce.current = true;
  }
  const focusManager = useFocusManager();
  const id = useId();
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        focusManager?.focusNext();
        break;
      case 'ArrowUp':
        focusManager?.focusPrevious();
        break;
      case 'Home':
        focusManager?.focusFirst();
        break;
      case 'End':
        focusManager?.focusLast();
        break;
    }
  };

  const toggle = () => {
    const i = expandedValues.indexOf(value);
    if (i > -1) {
      const newKeys = [...expandedValues];
      newKeys.splice(i, 1);
      setExpandedValues(newKeys);
      return;
    }

    if (mode === 'single') {
      setExpandedValues([value]);
    } else {
      setExpandedValues([...expandedValues, value]);
    }
    onOpen?.();
  };

  const chevron = (
    <div>
      <ArrowDropDownIcon
        aria-hidden="true"
        size="md"
        className={clsx(
          disabled ? 'text-disabled' : 'text-muted',
          isExpanded && 'rotate-180 transition-transform',
        )}
      />
    </div>
  );

  return (
    <div
      data-value={value}
      ref={ref}
      className={clsx(
        'transition-button',
        variant === 'default' && 'border-b',
        variant === 'outline' && 'rounded-panel border',
        variant === 'outline' && isExpanded && 'border-divider-darker shadow',
        disabled && 'text-disabled',
        className,
      )}
    >
      <h3
        className={clsx(
          'flex w-full items-center justify-between',
          disabled && 'pointer-events-none',
          isFirst && variant === 'default' && 'border-t',
          isExpanded && variant !== 'minimal' && size !== 'lg'
            ? 'border-b'
            : 'border-b border-b-transparent',
          variant === 'outline'
            ? isExpanded
              ? 'rounded-panel-t'
              : 'rounded-panel'
            : undefined,
        )}
        onMouseEnter={onHeaderMouseEnter}
        onMouseLeave={onHeaderMouseLeave}
      >
        <button
          disabled={disabled}
          aria-expanded={isExpanded}
          id={buttonId}
          aria-controls={panelId}
          type="button"
          ref={buttonRef}
          onKeyDown={onKeyDown}
          onClick={() => {
            if (!disabled) {
              toggle();
            }
          }}
          className={clsx(
            'flex min-w-0 flex-auto items-center gap-12 text-left outline-none transition-button hover:bg-hover focus-visible:bg-primary/focus',
            buttonPadding ? buttonPadding : 'px-16 py-12',
          )}
        >
          {chevronPosition === 'left' && chevron}
          {startIcon &&
            cloneElement<any>(startIcon, {
              size: startIcon.props?.size ?? 'md',
              className: clsx(
                (startIcon as any).props.className,
                disabled ? 'text-disabled' : startIconColor,
              ),
            })}
          <div className="flex-auto overflow-hidden overflow-ellipsis">
            <div
              className={clsx(
                fontClassName
                  ? fontClassName
                  : size === 'lg'
                    ? 'text-md font-semibold'
                    : 'text-sm',
                labelClassName,
              )}
            >
              {label}
            </div>
            {description && (
              <div className={descriptionClassName}>{description}</div>
            )}
          </div>
          {chevronPosition === 'right' && chevron}
        </button>
        {endAppend && (
          <div className="flex-shrink-0 px-4 text-sm text-muted">
            {endAppend}
          </div>
        )}
      </h3>
      <m.div
        aria-labelledby={id}
        role="region"
        variants={AccordionAnimation.variants}
        transition={AccordionAnimation.transition}
        initial={false}
        animate={isExpanded ? 'open' : 'closed'}
      >
        <div className={clsx(bodyPadding, bodyClassName)}>
          {!isLazy || wasExpandedOnce ? children : null}
        </div>
        {footerContent}
      </m.div>
    </div>
  );
}
