import {ConversationListItemType} from '@app/dashboard/conversation';
import {useConversationsTableColumnsConfig} from '@app/dashboard/conversations/conversations-table/columns/use-column-config';
import {Table} from '@common/ui/tables/table';
import {SortDescriptor} from '@common/ui/tables/types/sort-descriptor';

interface Props {
  data: ConversationListItemType[] | undefined;
  selectedTickets?: number[];
  onSelectionChange?: (conversationIds: number[]) => void;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (sortDescriptor: SortDescriptor) => void;
  className?: string;
  onRowAction: (item: ConversationListItemType) => void;
  activeColumns: string[];
}
export function GenericConversationsTable({
  data,
  selectedTickets,
  onSelectionChange,
  sortDescriptor,
  onSortChange,
  className,
  onRowAction,
  activeColumns,
}: Props) {
  const columnConfig = useConversationsTableColumnsConfig(activeColumns);
  return (
    <Table
      tableStyle="html"
      headerCellHeight="h-36"
      cellHeight="h-64"
      selectedRows={selectedTickets}
      onSelectionChange={values => onSelectionChange?.(values as number[])}
      columns={columnConfig}
      activeColumns={activeColumns}
      data={data || []}
      onAction={onRowAction}
      sortDescriptor={sortDescriptor}
      onSortChange={onSortChange}
      className={className}
      collapseOnMobile={false}
      enableSelection={!!onSelectionChange}
    />
  );
}
