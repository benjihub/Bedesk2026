import {ColumnConfig} from '@common/datatable/column-config';
import {TableContext} from '@common/ui/tables/table-context';
import {TableDataItem} from '@common/ui/tables/types/table-data-item';
import {Checkbox} from '@ui/forms/toggle/checkbox';
import {useTrans} from '@ui/i18n/use-trans';
import {Skeleton} from '@ui/skeleton/skeleton';
import {useContext} from 'react';

export const CheckboxColumnConfig: ColumnConfig<TableDataItem> = {
  key: 'checkbox',
  header: () => <SelectAllCheckbox />,
  align: 'center',
  width: 'w-24 flex-shrink-0',
  body: (item, row) => {
    if (row.isPlaceholder) {
      return <Skeleton size="w-24 h-24" variant="rect" />;
    }
    return <SelectRowCheckbox item={item} />;
  },
};

interface SelectRowCheckboxProps {
  item: TableDataItem;
}
function SelectRowCheckbox({item}: SelectRowCheckboxProps) {
  const {selectedRows, toggleRow} = useContext(TableContext);
  return (
    <Checkbox
      checked={selectedRows.includes(item.id)}
      onChange={() => toggleRow(item)}
    />
  );
}

function SelectAllCheckbox() {
  const {trans} = useTrans();

  const {data, selectedRows, onSelectionChange} = useContext(TableContext);
  const allRowsSelected = !!data.length && data.length === selectedRows.length;
  const someRowsSelected = !allRowsSelected && !!selectedRows.length;

  return (
    <Checkbox
      aria-label={trans({message: 'Select all'})}
      isIndeterminate={someRowsSelected}
      checked={allRowsSelected}
      onChange={() => {
        if (allRowsSelected) {
          onSelectionChange([]);
        } else {
          onSelectionChange(data.map(d => d.id));
        }
      }}
    />
  );
}
