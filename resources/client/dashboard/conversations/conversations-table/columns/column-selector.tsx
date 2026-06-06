import {useActiveColumns} from '@app/dashboard/conversations/conversations-table/columns/use-active-columns';
import {useAllAvailableColumns} from '@app/dashboard/conversations/conversations-table/columns/use-all-available-columns';
import {Button} from '@ui/buttons/button';
import {IconButton, IconButtonProps} from '@ui/buttons/icon-button';
import {Trans} from '@ui/i18n/trans';
import {ColumnCogIcon} from '@ui/icons/lucide/column-cog';
import {AddIcon} from '@ui/icons/material/Add';
import {CloseIcon} from '@ui/icons/material/Close';
import {DragIndicatorIcon} from '@ui/icons/material/DragIndicator';
import {useSortable} from '@ui/interactions/dnd/sortable/use-sortable';
import {List, ListItem} from '@ui/list/list';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {moveItemInNewArray} from '@ui/utils/array/move-item-in-new-array';
import {useRef} from 'react';

interface Props
  extends Partial<Omit<IconButtonProps, 'children' | 'disabled'>> {
  tableName: string;
  defaultColumns?: string[];
}
export function ColumnSelector({
  tableName,
  defaultColumns,
  size = 'sm',
  ...buttonProps
}: Props) {
  const [selectedColumns, setSelectedColumns, resetColumnsConfig] =
    useActiveColumns(tableName, defaultColumns);

  const availableColumns = useAllAvailableColumns();

  const inactiveColumns = availableColumns.filter(
    col => !selectedColumns.includes(col.key),
  );

  return (
    <DialogTrigger type="popover">
      <IconButton size={size} {...buttonProps}>
        <ColumnCogIcon />
      </IconButton>
      <Dialog size="xs">
        <DialogBody padding="px-8 py-16">
          <div className="mb-4 px-18 text-sm font-semibold">
            <Trans message="Visible columns" />
          </div>
          <List>
            {selectedColumns.map(column => (
              <SortableListItem
                key={column}
                columnKey={column}
                tableName={tableName}
              />
            ))}
          </List>
          {!!inactiveColumns.length && (
            <div className="mt-24">
              <div className="mb-4 px-18 text-sm font-semibold">
                <Trans message="Available columns" />
              </div>
              <List>
                {inactiveColumns.map(column => (
                  <ListItem
                    padding="py-8 pr-12 pl-18"
                    radius="rounded-button"
                    key={column.key}
                    onSelected={() => {
                      setSelectedColumns([...selectedColumns, column.key]);
                    }}
                    endIcon={<AddIcon className="text-muted" size="sm" />}
                  >
                    <Trans {...column.label} />
                  </ListItem>
                ))}
              </List>
            </div>
          )}
          <Button
            className="ml-16 mt-12"
            size="xs"
            variant="outline"
            color="primary"
            onClick={() => {
              resetColumnsConfig();
            }}
          >
            <Trans message="Reset to default" />
          </Button>
        </DialogBody>
      </Dialog>
    </DialogTrigger>
  );
}

interface SortableListItemProps {
  columnKey: string;
  tableName: string;
}
function SortableListItem({columnKey, tableName}: SortableListItemProps) {
  const [columns, setColumns] = useActiveColumns(tableName);
  const itemRef = useRef<HTMLDivElement>(null);
  const {sortableProps, dragHandleRef} = useSortable({
    item: columnKey,
    items: columns,
    type: 'conversationsTableSortable',
    ref: itemRef,
    onSortEnd: (oldIndex, newIndex) => {
      setColumns(moveItemInNewArray(columns, oldIndex, newIndex));
    },
  });

  const availableColumns = useAllAvailableColumns();

  const columnConfig = availableColumns.find(col => col.key === columnKey);

  if (!columnConfig) {
    return null;
  }

  return (
    <ListItem
      padding="py-4 px-8"
      radius="rounded-button"
      ref={itemRef}
      {...sortableProps}
      startIcon={
        <IconButton ref={dragHandleRef} size="xs">
          <DragIndicatorIcon />
        </IconButton>
      }
      endSection={
        <IconButton
          size="xs"
          iconSize="sm"
          disabled={columns.length === 1}
          onClick={() => {
            setColumns(columns.filter(col => col !== columnKey));
          }}
        >
          <CloseIcon />
        </IconButton>
      }
    >
      <Trans {...columnConfig.label} />
    </ListItem>
  );
}
