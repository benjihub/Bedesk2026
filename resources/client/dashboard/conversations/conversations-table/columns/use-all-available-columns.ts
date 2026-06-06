import {conversationsTableAvailableColumns} from '@app/dashboard/conversations/conversations-table/converstions-table-available-columns';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {useSuspenseQuery} from '@tanstack/react-query';
import {useMemo} from 'react';

export function useAllAvailableColumns() {
  const attributesQuery = useSuspenseQuery(
    helpdeskQueries.attributes.normalizedList({
      type: 'conversation',
      for: 'agent',
    }),
  );
  const attributes = attributesQuery.data.attributes;

  return useMemo(() => {
    const customAttributeColumns = attributes
      .filter(
        attribute =>
          attribute.key !== 'description' &&
          !conversationsTableAvailableColumns.find(
            col => col.key === attribute.key,
          ),
      )
      .map(attribute => ({
        key: `ca_${attribute.key}`,
        label: {message: attribute.name},
      }));

    if (customAttributeColumns.length > 0) {
      return [...conversationsTableAvailableColumns, ...customAttributeColumns];
    }

    return conversationsTableAvailableColumns;
  }, [attributes]);
}
