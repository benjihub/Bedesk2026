import {createContext} from 'react';
import type {ColumnConfig} from '../../datatable/column-config';
import type {TableProps} from './table';
import type {SortDescriptor} from './types/sort-descriptor';
import type {TableDataItem} from './types/table-data-item';

export type TableSelectionStyle = 'checkbox' | 'highlight';

export interface TableContextValue<T extends TableDataItem = TableDataItem> {
  isCollapsedMode: boolean;
  selectedRows: (string | number)[];
  onSelectionChange: (keys: (string | number)[]) => void;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => any;
  enableSelection?: boolean;
  enableSorting?: boolean;
  selectionStyle: TableSelectionStyle;
  data: T[];
  meta?: any;
  columns: ColumnConfig<T>[];
  toggleRow: (item: T) => void;
  selectRow: (item: T | null, merge?: boolean) => void;
  hideBorder: boolean;
  hideHeaderRow: boolean;
  headerRowBg?: string;
  collapseOnMobile: boolean;
  onAction: TableProps<T>['onAction'];
  selectRowOnContextMenu: TableProps<T>['selectRowOnContextMenu'];
  cellHeight: string | undefined;
  headerCellHeight: string | undefined;
  tableStyle: 'flex' | 'html';
}
export const TableContext = createContext<TableContextValue>(null!);
