import {HeaderCell} from '@common/ui/tables/header-cell';
import {TableContext} from '@common/ui/tables/table-context';
import clsx from 'clsx';
import {Fragment, useContext} from 'react';

export function TableHeaderRow() {
  const {columns, tableStyle, headerRowBg} = useContext(TableContext);
  const WrapperEl = tableStyle === 'html' ? 'thead' : Fragment;
  const RowEl = tableStyle === 'html' ? 'tr' : 'div';
  return (
    <WrapperEl>
      <RowEl
        role="row"
        aria-rowindex={1}
        tabIndex={-1}
        className={clsx(
          tableStyle === 'flex' && 'flex gap-x-16 px-16',
          headerRowBg,
        )}
      >
        {columns.map((column, columnIndex) => (
          <HeaderCell index={columnIndex} key={column.key} />
        ))}
      </RowEl>
    </WrapperEl>
  );
}
