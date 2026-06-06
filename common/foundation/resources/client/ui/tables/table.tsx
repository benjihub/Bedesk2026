import {CheckboxColumnConfig} from '@common/ui/tables/checkbox-column-config';
import {TableHeaderRow} from '@common/ui/tables/table-header-row';
import {useInteractOutside} from '@react-aria/interactions';
import {mergeProps, useObjectRef} from '@react-aria/utils';
import {useControlledState} from '@react-stately/utils';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import {isCtrlKeyPressed} from '@ui/utils/keybinds/is-ctrl-key-pressed';
import clsx from 'clsx';
import {
  cloneElement,
  ComponentPropsWithoutRef,
  Fragment,
  JSXElementConstructor,
  ReactElement,
  RefObject,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import {ColumnConfig} from '../../datatable/column-config';
import {useGridNavigation} from './navigate-grid';
import {
  TableContext,
  TableContextValue,
  TableSelectionStyle,
} from './table-context';
import {RowElementProps, TableRow} from './table-row';
import {SortDescriptor} from './types/sort-descriptor';
import {TableDataItem} from './types/table-data-item';

export interface TableProps<T extends TableDataItem>
  extends ComponentPropsWithoutRef<'table'> {
  className?: string;
  columns: ColumnConfig<T>[];
  activeColumns?: string[];
  hideHeaderRow?: boolean;
  data: T[];
  meta?: any;
  tableRef?: RefObject<HTMLTableElement>;
  selectedRows?: (number | string)[];
  defaultSelectedRows?: (number | string)[];
  onSelectionChange?: (keys: (number | string)[]) => void;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => any;
  enableSorting?: boolean;
  onDelete?: (items: T[]) => void;
  enableSelection?: boolean;
  selectionStyle?: TableSelectionStyle;
  ariaLabelledBy?: string;
  onAction?: (item: T, index: number) => void;
  selectRowOnContextMenu?: boolean;
  renderRowAs?: JSXElementConstructor<RowElementProps<T>>;
  tableBody?: ReactElement<TableBodyProps>;
  hideBorder?: boolean;
  closeOnInteractOutside?: boolean;
  collapseOnMobile?: boolean;
  cellHeight?: string;
  headerCellHeight?: string;
  headerRowBg?: string;
  tableStyle?: 'flex' | 'html';
}
export function Table<T extends TableDataItem>({
  className,
  columns: userColumns,
  activeColumns,
  collapseOnMobile = true,
  hideHeaderRow = false,
  headerRowBg,
  hideBorder = false,
  data,
  selectedRows: propsSelectedRows,
  defaultSelectedRows: propsDefaultSelectedRows,
  onSelectionChange: propsOnSelectionChange,
  sortDescriptor: propsSortDescriptor,
  onSortChange: propsOnSortChange,
  enableSorting = true,
  onDelete,
  enableSelection = true,
  selectionStyle = 'checkbox',
  ariaLabelledBy,
  selectRowOnContextMenu,
  onAction,
  renderRowAs,
  tableBody,
  meta,
  tableRef: propsTableRef,
  closeOnInteractOutside = false,
  cellHeight,
  headerCellHeight,
  tableStyle = 'flex',
  ...domProps
}: TableProps<T>) {
  const isMobile = useIsMobileMediaQuery();
  const isCollapsedMode = !!isMobile && collapseOnMobile;
  if (isCollapsedMode) {
    hideHeaderRow = true;
    hideBorder = true;
  }

  const [selectedRows, onSelectionChange] = useControlledState(
    propsSelectedRows,
    propsDefaultSelectedRows || [],
    propsOnSelectionChange,
  );

  const [sortDescriptor, onSortChange] = useControlledState(
    propsSortDescriptor,
    undefined,
    propsOnSortChange,
  );

  const toggleRow = useCallback(
    (item: TableDataItem) => {
      const newValues = [...selectedRows];
      if (!newValues.includes(item.id)) {
        newValues.push(item.id);
      } else {
        const index = newValues.indexOf(item.id);
        newValues.splice(index, 1);
      }
      onSelectionChange(newValues);
    },
    [selectedRows, onSelectionChange],
  );

  const selectRow = useCallback(
    // allow deselecting all rows by passing in null
    (item: TableDataItem | null, merge?: boolean) => {
      let newValues: (string | number)[] = [];
      if (item) {
        newValues = merge
          ? [...selectedRows?.filter(id => id !== item.id), item.id]
          : [item.id];
      }
      onSelectionChange(newValues);
    },
    [selectedRows, onSelectionChange],
  );

  // add checkbox columns to config, if selection is enabled
  const columns = useMemo(() => {
    const filteredColumns = userColumns.filter(c => {
      if (activeColumns && !activeColumns.includes(c.key)) {
        return false;
      }

      const visibleInMode = c.visibleInMode || 'regular';
      if (visibleInMode === 'all') {
        return true;
      }
      if (visibleInMode === 'compact' && isCollapsedMode) {
        return true;
      }
      if (visibleInMode === 'regular' && !isCollapsedMode) {
        return true;
      }
    });

    // sort columns by Columns
    if (activeColumns) {
      filteredColumns.sort((a, b) => {
        const aIndex = activeColumns.indexOf(a.key);
        const bIndex = activeColumns.indexOf(b.key);
        return aIndex - bIndex;
      });
    }

    const showCheckboxCell =
      enableSelection && selectionStyle !== 'highlight' && !isMobile;
    if (showCheckboxCell) {
      filteredColumns.unshift(CheckboxColumnConfig);
    }
    return filteredColumns;
  }, [
    isMobile,
    userColumns,
    enableSelection,
    selectionStyle,
    isCollapsedMode,
    activeColumns,
  ]);

  const contextValue: TableContextValue<T> = {
    isCollapsedMode,
    cellHeight,
    headerCellHeight,
    headerRowBg,
    hideBorder,
    hideHeaderRow,
    selectedRows,
    onSelectionChange,
    enableSorting,
    enableSelection,
    selectionStyle,
    data,
    columns,
    sortDescriptor,
    onSortChange,
    toggleRow,
    selectRow,
    onAction,
    selectRowOnContextMenu,
    meta,
    collapseOnMobile,
    tableStyle,
  };

  const navProps = useGridNavigation({
    cellCount: enableSelection ? columns.length + 1 : columns.length,
    rowCount: data.length + 1,
  });

  const tableBodyProps: TableBodyProps = {
    renderRowAs: renderRowAs as any,
  };

  if (!tableBody) {
    tableBody = <BasicTableBody {...tableBodyProps} />;
  } else {
    tableBody = cloneElement(tableBody, tableBodyProps);
  }

  // deselect rows when clicking outside the table
  const tableRef = useObjectRef(propsTableRef);
  useInteractOutside({
    ref: tableRef,
    onInteractOutside: e => {
      if (
        closeOnInteractOutside &&
        enableSelection &&
        selectedRows?.length &&
        // don't deselect if clicking on a dialog (for example is table row has a context menu)
        !(e.target as HTMLElement).closest('[role="dialog"]')
      ) {
        onSelectionChange([]);
      }
    },
  });

  const TableEl = tableStyle === 'html' ? 'table' : 'div';

  return (
    <TableContext.Provider value={contextValue as any}>
      <TableEl
        {...mergeProps(domProps, navProps, {
          onKeyDown: (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              if (selectedRows?.length) {
                onSelectionChange([]);
              }
            } else if (e.key === 'Delete') {
              e.preventDefault();
              e.stopPropagation();
              if (selectedRows?.length) {
                onDelete?.(
                  data.filter(item => selectedRows?.includes(item.id)),
                );
              }
            } else if (isCtrlKeyPressed(e) && e.key === 'a') {
              e.preventDefault();
              e.stopPropagation();
              if (enableSelection) {
                onSelectionChange(data.map(item => item.id));
              }
            }
          },
        })}
        tabIndex={0}
        role="grid"
        aria-rowcount={data.length + 1}
        aria-colcount={columns.length + 1}
        ref={tableRef}
        aria-multiselectable={enableSelection ? true : undefined}
        aria-labelledby={ariaLabelledBy}
        className={clsx(
          className,
          'isolate w-full select-none text-sm outline-none focus-visible:ring-2',
        )}
      >
        {!hideHeaderRow && <TableHeaderRow />}
        {tableBody}
      </TableEl>
    </TableContext.Provider>
  );
}

export interface TableBodyProps {
  renderRowAs?: TableProps<TableDataItem>['renderRowAs'];
}
function BasicTableBody({renderRowAs}: TableBodyProps) {
  const {data, tableStyle} = useContext(TableContext);
  const BodyEl = tableStyle === 'html' ? 'tbody' : Fragment;
  return (
    <BodyEl>
      {data.map((item, rowIndex) => (
        <TableRow
          item={item}
          index={rowIndex}
          key={item.id}
          renderAs={renderRowAs}
        />
      ))}
    </BodyEl>
  );
}
