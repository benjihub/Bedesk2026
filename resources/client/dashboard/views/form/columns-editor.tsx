import {useAllAvailableColumns} from '@app/dashboard/conversations/conversations-table/columns/use-all-available-columns';
import {defaultConversationsTableColumns} from '@app/dashboard/conversations/conversations-table/converstions-table-available-columns';
import {View} from '@app/dashboard/views/view';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {MessageDescriptor} from '@ui/i18n/message-descriptor';
import {Trans} from '@ui/i18n/trans';
import {AddIcon} from '@ui/icons/material/Add';
import {CloseIcon} from '@ui/icons/material/Close';
import {DragHandleIcon} from '@ui/icons/material/DragHandle';
import {useSortable} from '@ui/interactions/dnd/sortable/use-sortable';
import {List, ListItem} from '@ui/list/list';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {moveItemInNewArray} from '@ui/utils/array/move-item-in-new-array';
import {useRef} from 'react';
import {useFormContext, useWatch} from 'react-hook-form';
import {SectionHeader} from './section-header';

export function ColumnsEditor() {
  let columns = useWatch<View, 'columns'>({name: 'columns'});
  if (!columns?.length) {
    columns = defaultConversationsTableColumns;
  }

  const {setValue} = useFormContext<View>();

  const addColumn = (columnKey: string) => {
    setValue('columns', [...columns, columnKey], {shouldDirty: true});
  };

  const allColumns = useAllAvailableColumns();

  return (
    <div className="mb-64">
      <SectionHeader
        description={
          <Trans message="Choose which columns appear in the view by default. Drag and drop to reorder them." />
        }
      >
        <Trans message="Columns" />
      </SectionHeader>
      <List className="max-w-384 space-y-8">
        {columns.map(columnKey => {
          const column = allColumns.find(col => col.key === columnKey);
          if (!column) {
            return null;
          }
          return (
            <SortableListItem
              key={columnKey}
              columnKey={columnKey}
              columns={columns}
              label={column.label}
            />
          );
        })}
      </List>
      <AddColumnButton selectedColumns={columns} onSelected={addColumn} />
    </div>
  );
}

interface SortableListItemProps {
  columnKey: string;
  columns: string[];
  label: MessageDescriptor;
}
function SortableListItem({columnKey, columns, label}: SortableListItemProps) {
  const {setValue} = useFormContext<View>();
  const itemRef = useRef<HTMLDivElement>(null);

  const {sortableProps, dragHandleRef} = useSortable({
    item: columnKey,
    items: columns,
    type: 'columnsEditor',
    ref: itemRef,
    onSortEnd: (oldIndex, newIndex) => {
      setValue('columns', moveItemInNewArray(columns, oldIndex, newIndex), {
        shouldDirty: true,
      });
    },
  });

  const removeColumn = (key: string) => {
    setValue(
      'columns',
      columns.filter(col => col !== key),
      {
        shouldDirty: true,
      },
    );
  };

  return (
    <ListItem
      ref={itemRef}
      {...sortableProps}
      padding="p-6"
      className="rounded-input border text-sm capitalize"
      startIcon={
        <IconButton size="xs" iconSize="sm" ref={dragHandleRef}>
          <DragHandleIcon />
        </IconButton>
      }
      endSection={
        <IconButton
          size="xs"
          iconSize="sm"
          onClick={() => removeColumn(columnKey)}
        >
          <CloseIcon />
        </IconButton>
      }
    >
      <Trans {...label} />
    </ListItem>
  );
}

interface AddColumnButtonProps {
  selectedColumns: string[];
  onSelected: (columnKey: string) => void;
}
function AddColumnButton({selectedColumns, onSelected}: AddColumnButtonProps) {
  const allColumns = useAllAvailableColumns();
  const availableColumns = allColumns.filter(
    col => !selectedColumns.includes(col.key),
  );
  return (
    <MenuTrigger>
      <Button
        size="xs"
        variant="flat"
        color="primary"
        startIcon={<AddIcon />}
        className="mt-12"
        disabled={!availableColumns.length}
      >
        <Trans message="Add column" />
      </Button>
      <Menu>
        {availableColumns.map(column => (
          <Item
            key={column.key}
            value={column.key}
            onSelected={() => onSelected(column.key)}
          >
            <Trans {...column.label} />
          </Item>
        ))}
      </Menu>
    </MenuTrigger>
  );
}
