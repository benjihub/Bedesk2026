import {useTableCellStyle} from '@common/ui/tables/style/use-table-cell-style';
import {ArrowDownwardIcon} from '@ui/icons/material/ArrowDownward';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';
import {useContext, useState} from 'react';
import {TableContext} from './table-context';
import {SortDescriptor} from './types/sort-descriptor';

interface HeaderCellProps {
  index: number;
}
export function HeaderCell({index}: HeaderCellProps) {
  const {columns, sortDescriptor, onSortChange, enableSorting, tableStyle} =
    useContext(TableContext);
  const column = columns[index];

  const style = useTableCellStyle({
    index: index,
    isHeader: true,
  });

  const [isHovered, setIsHovered] = useState(false);

  const sortingKey = column.sortingKey || column.key;
  const allowSorting = column.allowsSorting && enableSorting;
  const {orderBy, orderDir} = sortDescriptor || {};

  const sortActive = allowSorting && orderBy === sortingKey;

  let ariaSort: 'ascending' | 'descending' | 'none' | undefined;
  if (sortActive && orderDir === 'asc') {
    ariaSort = 'ascending';
  } else if (sortActive && orderDir === 'desc') {
    ariaSort = 'descending';
  } else if (allowSorting) {
    ariaSort = 'none';
  }

  const toggleSorting = () => {
    if (!allowSorting) return;

    let newSort: SortDescriptor;

    // if this col was sorted desc, go to asc
    if (sortActive && orderDir === 'desc') {
      newSort = {orderDir: 'asc', orderBy: sortingKey};

      // if this col was sorted asc, clear sort
    } else if (sortActive && orderDir === 'asc') {
      newSort = {orderBy: undefined, orderDir: undefined};

      // if sort was on another col, or no sort was applied yet, start from desc
    } else {
      newSort = {orderDir: 'desc', orderBy: sortingKey};
    }

    onSortChange?.(newSort);
  };

  const sortVisible = sortActive || isHovered;
  const sortVariants = {
    visible: {opacity: 1, y: 0},
    hidden: {opacity: 0, y: '-25%'},
  };

  const CellEl = tableStyle === 'html' ? 'th' : 'div';

  return (
    <CellEl
      role="columnheader"
      tabIndex={-1}
      aria-colindex={index + 1}
      aria-sort={ariaSort}
      className={clsx(
        style,
        'text-xs font-medium text-muted',
        allowSorting && 'cursor-pointer',
      )}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      onKeyDown={e => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleSorting();
        }
      }}
      onClick={toggleSorting}
    >
      {column.hideHeader ? (
        <div className="opacity-0">{column.header()}</div>
      ) : (
        column.header()
      )}
      <AnimatePresence>
        {allowSorting && (
          <m.span
            variants={sortVariants}
            animate={sortVisible ? 'visible' : 'hidden'}
            initial={false}
            transition={{type: 'tween'}}
            key="sort-icon"
            className="-mt-2 ml-6 inline-block"
            data-testid="table-sort-button"
            aria-hidden={!sortVisible}
          >
            <ArrowDownwardIcon
              size="xs"
              className={clsx(
                'text-muted',
                orderDir === 'asc' &&
                  orderBy === sortingKey &&
                  'rotate-180 transition-transform',
              )}
            />
          </m.span>
        )}
      </AnimatePresence>
    </CellEl>
  );
}
