import {AdminDocsUrls} from '@app/admin/admin-config';
import {customersDatatableColumns} from '@app/dashboard/contacts/customers-datatable/customers-datatable-columns';
import {useCustomersDatatableFilters} from '@app/dashboard/contacts/customers-datatable/customers-datatable-filters';
import {CustomersDatatableItem} from '@app/dashboard/contacts/customers-datatable/customers-datatable-item';
import {validateCustomersSearch} from '@app/dashboard/contacts/customers-datatable/validate-customers-search';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import teamSvg from '@common/admin/roles/team.svg';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {BanUsersDialog} from '@common/admin/users/ban-users-dialog';
import {CreateUserDialog} from '@common/admin/users/create-user-dialog';
import {useUnbanUsers} from '@common/admin/users/requests/use-unban-users';
import {DeleteUsersDialog} from '@common/admin/users/user-datatable';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {DataTableExportCsvButton} from '@common/datatable/csv-export/data-table-export-csv-button';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {DatatableFilters} from '@common/datatable/page/datatable-filters';
import {
  DatatablePageHeaderBar,
  DatatablePageScrollContainer,
  DatatablePageWithHeaderBody,
  DatatablePageWithHeaderLayout,
} from '@common/datatable/page/datatable-page-with-header-layout';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Table} from '@common/ui/tables/table';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {Tab} from '@ui/tabs/tab';
import {TabList} from '@ui/tabs/tab-list';
import {Tabs} from '@ui/tabs/tabs';
import {Fragment, useState} from 'react';
import {Link, useSearchParams} from 'react-router';

export function getTabIndexFromName(name: string) {
  switch (name) {
    case 'verified':
      return 1;
    case 'visitors':
      return 2;
    case 'active':
      return 3;
    case 'suspended':
      return 4;
    default:
      return 0;
  }
}

export function Component() {
  const filters = useCustomersDatatableFilters();
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateCustomersSearch);

  const [selectedTab, setSelectedTab] = useState(() =>
    getTabIndexFromName(searchParams.type),
  );

  const query = useDatatableQuery(
    helpdeskQueries.customers.index(searchParams),
  );

  const actions = (
    <Fragment>
      <DataTableExportCsvButton endpoint="users/csv/export" />
      <DialogTrigger type="modal">
        <DataTableAddItemButton>
          <Trans message="Add new user" />
        </DataTableAddItemButton>
        <CreateUserDialog />
      </DialogTrigger>
    </Fragment>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <StaticPageTitle>
        <Trans message="Customers" />
      </StaticPageTitle>
      <DatatablePageHeaderBar
        title={<Trans message="Customers" />}
        showSidebarToggleButton
        border="border-none"
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.customers}
            size="xs"
          />
        }
      />
      <Tabs
        className="flex-shrink-0"
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
      >
        <TabList className="mx-24">
          <Tab elementType={Link} to="../customers">
            <Trans message="All" />
          </Tab>
          <Tab elementType={Link} to="?type=verified">
            <Trans message="Verified" />
          </Tab>
          <Tab elementType={Link} to="?type=visitors">
            <Trans message="Visitors" />
          </Tab>
          <Tab elementType={Link} to="?type=active">
            <Trans message="Active" />
          </Tab>
          <Tab elementType={Link} to="?type=suspended">
            <Trans message="Suspended" />
          </Tab>
        </TabList>
      </Tabs>
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={actions}
          selectedItems={selectedIds}
          selectedActions={
            <SelectedActions
              selectedIds={selectedIds as number[]}
              setSelectedIds={setSelectedIds}
              customers={query.items}
            />
          }
          filters={filters}
        />
        <DatatableFilters filters={filters} />
        <DatatablePageScrollContainer>
          <Table
            columns={customersDatatableColumns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection
            selectedRows={selectedIds}
            onSelectionChange={setSelectedIds}
            cellHeight="h-56"
          />
          {query.isEmpty && <EmptyStateMessage isFiltering={isFiltering} />}
          <DataTablePaginationFooter
            query={query}
            onPageChange={page => mergeIntoSearchParams({page})}
            onPerPageChange={perPage => mergeIntoSearchParams({perPage})}
          />
        </DatatablePageScrollContainer>
      </DatatablePageWithHeaderBody>
    </DatatablePageWithHeaderLayout>
  );
}

interface SelectedActionsProps {
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
  customers: CustomersDatatableItem[];
}
function SelectedActions({
  selectedIds,
  setSelectedIds,
  customers,
}: SelectedActionsProps) {
  const allSuspended = customers
    .filter(customer => selectedIds.includes(customer.id))
    .every(customer => customer.banned_at);
  const unsuspend = useUnbanUsers(selectedIds);

  const suspendButton = (
    <DialogTrigger type="modal">
      <Button variant="outline" color="danger">
        <Trans message="Suspend" />
      </Button>
      <BanUsersDialog
        userIds={selectedIds}
        onSuccess={() => setSelectedIds([])}
      />
    </DialogTrigger>
  );
  const unsuspendButton = (
    <Button
      variant="outline"
      onClick={() =>
        unsuspend.mutate(undefined, {
          onSuccess: () => setSelectedIds([]),
        })
      }
    >
      <Trans message="Unsuspend" />
    </Button>
  );

  return (
    <Fragment>
      {allSuspended ? unsuspendButton : suspendButton}
      <DialogTrigger type="modal">
        <Button variant="flat" color="danger">
          <Trans message="Delete" />
        </Button>
        <DeleteUsersDialog
          selectedIds={selectedIds}
          onDelete={() => setSelectedIds([])}
        />
      </DialogTrigger>
    </Fragment>
  );
}

interface EmptyStateMessageProps {
  isFiltering: boolean;
}
function EmptyStateMessage({isFiltering}: EmptyStateMessageProps) {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  let title = <Trans message="No customers have been created yet" />;

  if (type === 'verified') {
    title = <Trans message="No customers with verified email" />;
  }

  if (type === 'visitors') {
    title = <Trans message="No customers have visited the site recently" />;
  }

  if (type === 'active') {
    title = <Trans message="No customers have been active recently" />;
  }

  if (type === 'suspended') {
    title = <Trans message="No customers have been suspended" />;
  }

  return (
    <DataTableEmptyStateMessage
      className="mt-44"
      isFiltering={isFiltering}
      image={teamSvg}
      title={title}
      filteringTitle={<Trans message="No matching customers" />}
    />
  );
}
