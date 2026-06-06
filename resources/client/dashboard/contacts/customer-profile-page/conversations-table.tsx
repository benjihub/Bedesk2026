import {GenericConversationsTable} from '@app/dashboard/conversations/conversations-table/generic-conversations-table';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearchWithSimplePagination} from '@common/datatable/filters/utils/validate-datatable-search';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {useRequiredParams} from '@common/ui/navigation/use-required-params';
import {Trans} from '@ui/i18n/trans';
import {MessagesSquareIcon} from '@ui/icons/lucide/messages-square-icon';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {Fragment} from 'react/jsx-runtime';

const activeColumns = [
  'status',
  'summary',
  'assignee_id',
  'updated_at',
  'created_at',
];

export function ConversationsTable() {
  const navigate = useNavigate();
  const {userId} = useRequiredParams(['userId']);

  const {mergeIntoSearchParams, sortDescriptor, searchParams} =
    useDatatableSearchParams(validateDatatableSearchWithSimplePagination);

  const query = useDatatableQuery(
    helpdeskQueries.customers.indexConversations(userId, searchParams),
  );

  if (query.isEmpty) {
    return <EmptyStateMessage />;
  }

  return (
    <Fragment>
      <div className="overflow-x-auto">
        <GenericConversationsTable
          data={query.items}
          activeColumns={activeColumns}
          sortDescriptor={sortDescriptor}
          onSortChange={mergeIntoSearchParams}
          onRowAction={conversation => {
            navigate(`/dashboard/conversations/${conversation.id}`);
          }}
        />
      </div>
      <DataTablePaginationFooter
        hideIfOnlyOnePage
        onPageChange={page => mergeIntoSearchParams({page})}
        query={query}
      />
    </Fragment>
  );
}

function EmptyStateMessage() {
  return (
    <div className="mt-124 flex w-full items-center justify-center">
      <IllustratedMessage
        size="sm"
        image={<MessagesSquareIcon size="xl" />}
        imageMargin="mb-12"
        imageHeight="h-auto"
        title={
          <Trans message="Customer has not started any conversation yet" />
        }
      />
    </div>
  );
}
