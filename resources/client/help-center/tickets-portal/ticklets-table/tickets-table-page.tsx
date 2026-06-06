import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {helpCenterQueries} from '@app/help-center/help-center-queries';
import {HcSearchBar} from '@app/help-center/search/hc-search-bar';
import searchImage from '@app/help-center/search/search.svg';
import {ticketsTableColumns} from '@app/help-center/tickets-portal/ticklets-table/tickets-table-columns';
import {
  TicketsTableSearchParams,
  validateTicketsTableSearch,
} from '@app/help-center/tickets-portal/ticklets-table/tickets-table-schema';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {Navbar} from '@common/ui/navigation/navbar/navbar';
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Table} from '@common/ui/tables/table';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Button} from '@ui/buttons/button';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {SearchIcon} from '@ui/icons/material/Search';
import {Fragment, useRef} from 'react';
import {Link} from 'react-router';

export function Component() {
  const navigate = useNavigate();
  return (
    <div>
      <Navbar menuPosition="header">
        <HcSearchBar />
      </Navbar>
      <main className="container mx-auto px-24 pb-48">
        <Breadcrumb size="sm" className="mb-48 mt-34">
          <BreadcrumbItem onSelected={() => navigate(`/hc`)}>
            <Trans message="Help center" />
          </BreadcrumbItem>
          <BreadcrumbItem onSelected={() => navigate(`/hc/tickets`)}>
            <Trans message="Tickets" />
          </BreadcrumbItem>
        </Breadcrumb>
        <div className="mb-34 flex items-start justify-between gap-12">
          <h1 className="text-3xl font-semibold">
            <Trans message="My tickets" />
          </h1>
          <Button
            elementType={Link}
            to="/hc/tickets/new"
            size="sm"
            variant="outline"
          >
            <Trans message="New ticket" />
          </Button>
        </div>
        <TicketTable />
      </main>
    </div>
  );
}

function TicketTable() {
  const {trans} = useTrans();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const {searchParams, mergeIntoSearchParams, setSearchQuery, sortDescriptor} =
    useDatatableSearchParams<TicketsTableSearchParams>(
      validateTicketsTableSearch,
    );

  const query = useSuspenseQuery(
    helpCenterQueries.customerConversations.index(searchParams),
  );
  const data = query.data.pagination.data;

  const isFiltering = !!searchParams.query || !!searchParams.statusId;

  const content = !data.length ? (
    <StateMessage isFiltering={isFiltering} />
  ) : (
    <Fragment>
      <div className="overflow-x-auto">
        <Table
          className="min-w-[870px]"
          columns={ticketsTableColumns}
          data={data}
          sortDescriptor={sortDescriptor}
          onSortChange={value => mergeIntoSearchParams(value)}
          enableSelection={false}
          onAction={item => navigate(`/hc/tickets/${item.id}`)}
          cellHeight="h-70"
        />
      </div>
      {(query.data?.pagination?.next_page ||
        query.data?.pagination?.prev_page) && (
        <DataTablePaginationFooter
          className="mt-12 w-full"
          query={query}
          onPageChange={page => mergeIntoSearchParams({page})}
        />
      )}
    </Fragment>
  );

  return (
    <Fragment>
      <form
        className="mb-34 items-end justify-between gap-24 md:flex"
        onSubmit={e => {
          e.preventDefault();
          setSearchQuery(inputRef.current?.value);
        }}
      >
        <TextField
          className="flex-auto max-md:mb-24"
          inputRef={inputRef}
          defaultValue={searchParams.query}
          onBlur={() => setSearchQuery()}
          placeholder={trans(message('Search tickets'))}
          startAdornment={<SearchIcon />}
        />
        <StatusSelect
          value={searchParams.statusId}
          onChange={newValue => mergeIntoSearchParams({statusId: newValue})}
        />
      </form>
      {content}
    </Fragment>
  );
}

interface StateMessageProps {
  isFiltering: boolean;
}
function StateMessage({isFiltering}: StateMessageProps) {
  return (
    <DataTableEmptyStateMessage
      isFiltering={isFiltering}
      size="sm"
      className="mt-48"
      image={searchImage}
      title={<Trans message="You have not created any tickets yet" />}
      filteringTitle={
        <Trans message="No tickets match your search query or filters" />
      }
    />
  );
}

interface StatusSelectProps {
  value: string | null;
  onChange: (value: string) => void;
}
function StatusSelect({value = '', onChange}: StatusSelectProps) {
  const query = useSuspenseQuery(helpdeskQueries.statuses.dropdownList('user'));
  return (
    <Select
      className="flex-shrink-0 md:min-w-172"
      selectionMode="single"
      selectedValue={value ?? ''}
      onSelectionChange={newValue => onChange(newValue as string)}
    >
      <Item value="">
        <Trans message="All tickets" />
      </Item>
      {query.data.statuses.map(status => (
        <Item key={status.id} value={`${status.id}`}>
          <Trans message={status.label} />
        </Item>
      ))}
    </Select>
  );
}
