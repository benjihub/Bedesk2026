import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import clsx from 'clsx';
import {ReactElement, ReactNode, useId} from 'react';
import {StaticPageTitle} from '../../seo/static-page-title';
import {TableProps} from '../../ui/tables/table';
import {TableDataItem} from '../../ui/tables/types/table-data-item';
import {DataTable, DataTableProps} from '../data-table';

interface Props<T extends TableDataItem> extends DataTableProps<T> {
  title?: ReactElement<MessageDescriptor>;
  setPageTitle?: boolean;
  headerContent?: ReactNode;
  headerItemsAlign?: string;
  enableSelection?: boolean;
  onRowAction?: TableProps<T>['onAction'];
  padding?: string;
  className?: string;
}
export function DataTablePage<T extends TableDataItem>({
  title,
  setPageTitle = true,
  headerContent,
  headerItemsAlign = 'items-end',
  className,
  padding,
  ...dataTableProps
}: Props<T>) {
  const titleId = useId();

  return (
    <div className={clsx(padding ?? 'p-12 md:p-24', className)}>
      {title && (
        <div
          className={clsx(
            'mb-16',
            headerContent && `flex ${headerItemsAlign} gap-4`,
          )}
        >
          {setPageTitle && <StaticPageTitle>{title}</StaticPageTitle>}
          <h1 className="text-3xl font-light first:capitalize" id={titleId}>
            {title}
          </h1>
          {headerContent}
        </div>
      )}
      <DataTable
        {...dataTableProps}
        tableDomProps={{
          'aria-labelledby': title ? titleId : undefined,
        }}
      />
    </div>
  );
}
