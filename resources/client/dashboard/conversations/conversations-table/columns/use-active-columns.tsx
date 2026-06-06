import {defaultConversationsTableColumns} from '@app/dashboard/conversations/conversations-table/converstions-table-available-columns';
import {useLocalStorage} from '@ui/utils/hooks/local-storage';
import {useCallback} from 'react';

export function useActiveColumns(tableName: string, defaultColumns?: string[]) {
  const [columns, setColumns] = useLocalStorage<string[] | undefined>(
    `${tableName}-columns`,
    defaultColumns ?? defaultConversationsTableColumns,
  );

  const resetColumnsConfig = useCallback(() => {
    setColumns(defaultColumns ?? defaultConversationsTableColumns);
  }, [tableName, defaultColumns]);

  return [columns ?? [], setColumns, resetColumnsConfig] as const;
}
