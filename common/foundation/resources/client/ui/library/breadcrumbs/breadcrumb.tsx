import {
  useLayoutEffect,
  useResizeObserver,
  useValueEffect,
} from '@react-aria/utils';
import {
  BreadcrumbItem,
  BreadcrumbItemProps,
} from '@ui/breadcrumbs/breadcrumb-item';
import {ButtonSize} from '@ui/buttons/button-size';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {useTrans} from '@ui/i18n/use-trans';
import {MoreHorizIcon} from '@ui/icons/material/MoreHoriz';
import {IconSize} from '@ui/icons/svg-icon';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import clsx from 'clsx';
import React, {
  cloneElement,
  ReactElement,
  ReactNode,
  useCallback,
  useRef,
} from 'react';

const MIN_VISIBLE_ITEMS = 1;
const MAX_VISIBLE_ITEMS = 10;

export interface BreadcrumbsProps {
  children?: ReactNode;
  isDisabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  currentIsClickable?: boolean;
  inactiveMuted?: boolean;
  isNavigation?: boolean;
}
export function Breadcrumb(props: BreadcrumbsProps) {
  const {
    size = 'md',
    children,
    isDisabled,
    className,
    currentIsClickable,
    isNavigation,
    inactiveMuted = true,
  } = props;
  const {trans} = useTrans();
  const style = sizeStyle(size);

  // Not using React.Children.toArray because it mutates the key prop.
  const childArray: ReactElement<BreadcrumbItemProps>[] = [];
  React.Children.forEach(children, child => {
    if (React.isValidElement(child)) {
      childArray.push(child as ReactElement<BreadcrumbItemProps>);
    }
  });

  const domRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const [visibleItems, setVisibleItems] = useValueEffect(childArray.length);

  const updateOverflow = useCallback(() => {
    const computeVisibleItems = (itemCount: number) => {
      // Refs can be null at runtime.
      const currListRef: HTMLUListElement | null = listRef.current;
      if (!currListRef) {
        return;
      }

      const listItems = Array.from(currListRef.children) as HTMLLIElement[];
      if (!listItems.length) return;

      const containerWidth = currListRef.offsetWidth;
      const isShowingMenu = childArray.length > itemCount;
      let calculatedWidth = 0;
      let newVisibleItems = 0;
      let maxVisibleItems = MAX_VISIBLE_ITEMS;

      calculatedWidth += listItems.shift()!.offsetWidth;
      newVisibleItems++;

      if (isShowingMenu) {
        calculatedWidth += listItems.shift()?.offsetWidth ?? 0;
        maxVisibleItems--;
      }

      if (calculatedWidth >= containerWidth) {
        newVisibleItems--;
      }

      // Ensure the last breadcrumb isn't truncated when we measure it.
      if (listItems.length > 0) {
        const last = listItems.pop();
        last!.style.overflow = 'visible';

        calculatedWidth += last!.offsetWidth;
        if (calculatedWidth < containerWidth) {
          newVisibleItems++;
        }

        last!.style.overflow = '';
      }
      for (const breadcrumb of listItems.reverse()) {
        calculatedWidth += breadcrumb.offsetWidth;
        if (calculatedWidth < containerWidth) {
          newVisibleItems++;
        }
      }

      return Math.max(
        MIN_VISIBLE_ITEMS,
        Math.min(maxVisibleItems, newVisibleItems),
      );
    };

    setVisibleItems(function* () {
      // Update to show all items.
      yield childArray.length;

      // Measure, and update to show the items that fit.
      const newVisibleItems = computeVisibleItems(childArray.length);
      yield newVisibleItems;

      // If the number of items is less than the number of children,
      // then update again to ensure that the menu fits.
      if (newVisibleItems! < childArray.length && newVisibleItems! > 1) {
        yield computeVisibleItems(newVisibleItems!);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listRef, children, setVisibleItems]);

  useResizeObserver({ref: domRef, onResize: updateOverflow});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(updateOverflow, [children]);

  let contents = childArray;
  if (childArray.length > visibleItems) {
    const selectedKey = childArray.length - 1;

    const menuItem = (
      <BreadcrumbItem key="menu" sizeStyle={style} isMenuTrigger>
        <MenuTrigger selectionMode="single" selectedValue={selectedKey}>
          <IconButton aria-label="…" disabled={isDisabled} size={style.btn}>
            <MoreHorizIcon />
          </IconButton>
          <Menu>
            {childArray.map((child, index) => {
              const isLast = selectedKey === index;
              return (
                <Item
                  to={child.props.to}
                  key={index}
                  value={index}
                  onSelected={() => {
                    if (!isLast) {
                      child.props.onSelected?.();
                    }
                  }}
                >
                  {cloneElement(child, {isMenuItem: true})}
                </Item>
              );
            })}
          </Menu>
        </MenuTrigger>
      </BreadcrumbItem>
    );

    contents = [menuItem];
    const breadcrumbs = [...childArray];
    let endItems = visibleItems;
    if (visibleItems > 1) {
      contents.unshift(breadcrumbs.shift()!);
      endItems--;
    }
    contents.push(...breadcrumbs.slice(-endItems));
  }

  const lastIndex = contents.length - 1;
  const breadcrumbItems = contents.map((child, index) => {
    const isCurrent = index === lastIndex;
    const isClickable = !isCurrent || currentIsClickable;

    return cloneElement<BreadcrumbItemProps>(child, {
      key: child.key || index,
      isCurrent,
      sizeStyle: style,
      isClickable,
      isDisabled,
      inactiveMuted,
      isLink: isNavigation && child.key !== 'menu',
    });
  });

  const Element = isNavigation ? 'nav' : 'div';

  return (
    <Element
      className={clsx(className, 'breadcrumb-root w-full min-w-0')} // prevent flex parent overflow
      aria-label={trans({message: 'Breadcrumbs'})}
      ref={domRef}
    >
      <ol
        ref={listRef}
        className={clsx('flex flex-nowrap justify-start', style.minHeight)}
      >
        {breadcrumbItems}
      </ol>
    </Element>
  );
}

function sizeStyle(size: BreadcrumbsProps['size']): BreadcrumbSizeStyle {
  switch (size) {
    case 'sm':
      return {font: 'text-sm', icon: 'sm', btn: 'sm', minHeight: 'min-h-36'};
    case 'lg':
      return {font: 'text-lg', icon: 'sm', btn: 'md', minHeight: 'min-h-42'};
    case 'xl':
      return {font: 'text-xl', icon: 'sm', btn: 'md', minHeight: 'min-h-42'};
    default:
      return {font: 'text-base', icon: 'sm', btn: 'md', minHeight: 'min-h-42'};
  }
}

export interface BreadcrumbSizeStyle {
  font: string;
  icon: IconSize;
  btn: ButtonSize;
  minHeight: string;
}
