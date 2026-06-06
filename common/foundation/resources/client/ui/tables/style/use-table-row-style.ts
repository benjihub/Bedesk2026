import {TableContext} from '@common/ui/tables/table-context';
import {useIsDarkMode} from '@ui/themes/use-is-dark-mode';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import clsx from 'clsx';
import {useContext} from 'react';

interface Props {
  index: number;
  isSelected: boolean;
  isHeader?: boolean;
}
export function useTableRowStyle({index, isSelected, isHeader}: Props) {
  const isDarkMode = useIsDarkMode();
  const isMobile = useIsMobileMediaQuery();
  const {
    hideBorder,
    enableSelection,
    collapseOnMobile,
    onAction,
    isCollapsedMode,
    tableStyle,
  } = useContext(TableContext);
  const isFirst = index === 0;

  return clsx(
    tableStyle === 'flex' && 'flex gap-x-16',
    'break-inside-avoid outline-none border border-transparent',
    isCollapsedMode && 'rounded-panel',
    onAction && 'cursor-pointer',
    isMobile && collapseOnMobile && hideBorder
      ? 'mb-8 pl-8 pr-0 rounded'
      : 'px-16',
    !hideBorder && 'border-b-divider',
    !hideBorder && isFirst && 'border-t-divider',
    isSelected &&
      !isDarkMode &&
      'bg-primary/selected hover:bg-primary/focus focus-visible:bg-primary/focus',
    isSelected &&
      isDarkMode &&
      'bg-selected hover:bg-focus focus-visible:bg-focus',
    !isSelected &&
      !isHeader &&
      (enableSelection || onAction) &&
      'focus-visible:bg-focus hover:bg-hover',
  );
}
