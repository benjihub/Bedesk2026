import {RowContext} from '@common/datatable/column-config';
import {useTableCellStyle} from '@common/ui/tables/style/use-table-cell-style';
import {useContext, useMemo} from 'react';
import {TableContext} from './table-context';
import {TableDataItem} from './types/table-data-item';

interface TableCellProps {
  rowIsHovered: boolean;
  rowIndex: number;
  index: number;
  item: TableDataItem;
  id?: string;
}
export function TableCell({
  rowIndex,
  rowIsHovered,
  index,
  item,
  id,
}: TableCellProps) {
  const {columns, tableStyle} = useContext(TableContext);
  const column = columns[index];

  const rowContext: RowContext = useMemo(() => {
    return {
      index: rowIndex,
      isHovered: rowIsHovered,
      isPlaceholder: item.isPlaceholder,
    };
  }, [rowIndex, rowIsHovered, item.isPlaceholder]);

  const style = useTableCellStyle({
    index: index,
    isHeader: false,
  });

  const CellEl = tableStyle === 'html' ? 'td' : 'div';

  let body = column.body(item, rowContext);

  // wrap with extra element to support overflow ellipsis, not needed for placeholders
  if (!rowContext.isPlaceholder) {
    body = (
      <div className="min-w-0 overflow-hidden overflow-ellipsis">{body}</div>
    );
  }

  return (
    <CellEl
      tabIndex={-1}
      role="gridcell"
      aria-colindex={index + 1}
      id={id}
      className={style}
    >
      {body}
    </CellEl>
  );
}
