import {ColumnConfig} from '@common/datatable/column-config';
import {TableContext} from '@common/ui/tables/table-context';
import clsx from 'clsx';
import {useContext} from 'react';

interface Props {
  index: number;
  isHeader: boolean;
}
export function useTableCellStyle({index, isHeader}: Props) {
  const {
    columns,
    cellHeight = 'h-50',
    headerCellHeight = 'h-46',
    tableStyle,
  } = useContext(TableContext);
  const isFirst = index === 0;
  const isLast = columns.length - 1 === index;
  const column = columns[index];
  const height = isHeader ? headerCellHeight : cellHeight;

  if (tableStyle === 'flex') {
    return getFlexStyle(column, height);
  }

  return getHtmlStyle(column, isFirst, isLast, height);
}

function getHtmlStyle(
  col: ColumnConfig<any>,
  isFirst: boolean,
  isLast: boolean,
  height: string,
): string {
  let padding = col?.padding;

  if (!padding) {
    if (isFirst) {
      padding = 'pl-16 pr-12';
    } else if (isLast) {
      padding = 'pr-16 pl-12';
    } else {
      padding = 'px-12';
    }
  }

  return clsx(
    'overflow-hidden whitespace-nowrap outline-none focus-visible:outline focus-visible:outline-offset-2 text-left',
    height,
    col?.maxWidth,
    col?.width,
    padding,
    col?.className,
  );
}

function getFlexStyle(col: ColumnConfig<any>, height: string) {
  let justify = 'justify-start';
  if (col?.align === 'center') {
    justify = 'justify-center';
  } else if (col?.align === 'end') {
    justify = 'justify-end';
  }

  const userPadding = col?.padding;

  return clsx(
    'flex items-center overflow-hidden whitespace-nowrap overflow-ellipsis outline-none focus-visible:outline focus-visible:outline-offset-2',
    height,
    col?.width ?? 'flex-1',
    col?.maxWidth,
    col?.minWidth,
    justify,
    userPadding,
    col?.className,
  );
}
