import {Trans} from '@ui/i18n/trans';
import {OverlayProps} from '@ui/overlays/overlay-props';
import {Popover} from '@ui/overlays/popover';
import {Tray} from '@ui/overlays/tray';
import {ProgressCircle} from '@ui/progress/progress-circle';
import {rootEl} from '@ui/root-el';
import {useIsMobileDevice} from '@ui/utils/hooks/is-mobile-device';
import clsx from 'clsx';
import {AnimatePresence} from 'framer-motion';
import {
  cloneElement,
  ComponentPropsWithoutRef,
  JSXElementConstructor,
  ReactElement,
  ReactNode,
  RefObject,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {createPortal} from 'react-dom';
import {ListBoxContext, useListboxContext} from './listbox-context';
import {UseListboxReturn} from './types';

interface Props extends ComponentPropsWithoutRef<'div'> {
  listbox: UseListboxReturn;
  mobileOverlay?: JSXElementConstructor<OverlayProps>;
  children?: ReactElement;
  searchField?: ReactNode;
  isLoading?: boolean;
  isPending?: boolean;
  onClose?: () => void;
  prepend?: boolean;
  contentClassName?: string;
}
export function Listbox({
  listbox,
  children: trigger,
  isLoading,
  isPending,
  mobileOverlay = Tray,
  searchField,
  onClose,
  prepend,
  className: listboxClassName,
  contentClassName,
  ...domProps
}: Props) {
  const isMobile = useIsMobileDevice();
  const {
    floatingWidth,
    floatingMinWidth = 'min-w-180',
    collection,
    showEmptyMessage,
    state: {isOpen, setIsOpen},
    positionStyle,
    floating,
    refs,
  } = listbox;

  const Overlay = !prepend && isMobile ? mobileOverlay : Popover;

  const className = clsx(
    'text-main text-base sm:text-sm outline-none bg-elevated flex flex-col',
    !prepend && 'shadow-xl border py-4 max-h-inherit',
    listboxClassName,

    // tray will apply its own rounding and max width
    Overlay === Popover && 'rounded-panel',
    Overlay === Popover && floatingWidth === 'auto'
      ? `max-w-288 ${floatingMinWidth}`
      : '',
  );

  const children = useMemo(() => {
    let sectionIndex = 0;
    const renderedSections: ReactElement[] = [];
    return [...collection.values()].reduce<ReactElement[]>((prev, curr) => {
      if (!curr.section) {
        prev.push(
          cloneElement(curr.element, {
            key: curr.element.key || curr.element.props.value,
          }),
        );
      } else if (!renderedSections.includes(curr.section)) {
        const section = cloneElement(curr.section, {
          key: curr.section.key || sectionIndex,
          index: sectionIndex,
        });
        prev.push(section);
        // clone element will create new instance of object, need to keep
        // track of original instance so sections are not duplicated
        renderedSections.push(curr.section);
        sectionIndex++;
      }
      return prev;
    }, []);
  }, [collection]);

  const showContent =
    (prepend && !isPending) ||
    children.length > 0 ||
    (showEmptyMessage && !isLoading && !isPending);

  const innerContent = showContent ? (
    <div className={className} role="presentation">
      {searchField}
      <FocusContainer
        isLoading={isLoading}
        isPending={isPending}
        className={contentClassName}
        {...domProps}
      >
        {children}
      </FocusContainer>
    </div>
  ) : null;

  return (
    <ListBoxContext.Provider value={listbox}>
      {trigger}
      {prepend
        ? innerContent
        : rootEl &&
          createPortal(
            <AnimatePresence>
              {isOpen && showContent && (
                <Overlay
                  triggerRef={refs.reference as RefObject<HTMLElement>}
                  restoreFocus
                  isOpen={isOpen}
                  onClose={() => {
                    onClose?.();
                    setIsOpen(false);
                  }}
                  isDismissable
                  style={positionStyle}
                  ref={floating}
                >
                  {innerContent!}
                </Overlay>
              )}
            </AnimatePresence>,
            rootEl,
          )}
    </ListBoxContext.Provider>
  );
}

interface WrapperProps extends ComponentPropsWithoutRef<'div'> {
  isLoading?: boolean;
  isPending?: boolean;
  children: ReactElement[];
  className?: string;
}
function FocusContainer({
  className,
  children,
  isLoading,
  isPending,
  ...domProps
}: WrapperProps) {
  const {
    role,
    listboxId,
    virtualFocus,
    focusItem,
    state: {activeIndex, setActiveIndex, selectedIndex},
  } = useListboxContext();
  const autoFocusRef = useRef(true);
  const domRef = useRef<HTMLDivElement>(null);

  // reset activeIndex on unmount
  useEffect(() => {
    return () => setActiveIndex(null);
  }, [setActiveIndex]);

  // focus active index or menu on mount, because menu will be closed
  // on trigger keyDown and focus won't be applied to items
  useEffect(() => {
    if (autoFocusRef.current) {
      const indexToFocus = activeIndex ?? selectedIndex;
      // if no activeIndex, focus menu itself
      if (indexToFocus == null && !virtualFocus) {
        requestAnimationFrame(() => {
          domRef.current?.focus({preventScroll: true});
        });
      } else if (indexToFocus != null) {
        // wait until next frame, otherwise auto scroll might not work
        requestAnimationFrame(() => {
          focusItem('increment', indexToFocus);
        });
      }
    }
    autoFocusRef.current = false;
  }, [activeIndex, selectedIndex, focusItem, virtualFocus]);

  return (
    <div
      tabIndex={virtualFocus ? undefined : -1}
      role={role}
      id={listboxId}
      className={clsx(
        'flex-auto overflow-y-auto overscroll-contain outline-none',
        className,
      )}
      ref={domRef}
      {...domProps}
    >
      {children.length ? (
        children
      ) : isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <ProgressCircle isIndeterminate size="sm" />
        </div>
      ) : (
        !isPending && <EmptyMessage />
      )}
    </div>
  );
}

function EmptyMessage() {
  return (
    <div className="px-8 py-4 text-sm italic text-muted">
      <Trans message="There are no items matching your query" />
    </div>
  );
}
