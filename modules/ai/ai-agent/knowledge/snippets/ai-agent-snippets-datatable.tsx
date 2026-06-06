import {aiAgentQueries} from '@ai/ai-agent/ai-agent-queries';
import {AiAgentSnippet} from '@ai/ai-agent/knowledge/snippets/ai-agent-snippet';
import {useIngestSnippets} from '@ai/ai-agent/knowledge/snippets/use-ingest-snippets';
import {useUningestSnippets} from '@ai/ai-agent/knowledge/snippets/use-uningest-snippets';
import onlineArticlesImg from '@app/help-center/articles/article-datatable/online-articles.svg';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {ColumnConfig} from '@common/datatable/column-config';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {
  BackendFilter,
  FilterControlType,
  FilterOperator,
} from '@common/datatable/filters/backend-filter';
import {createdAtFilter} from '@common/datatable/filters/timestamp-filters';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
import {DataTableContext} from '@common/datatable/page/data-table-context';
import {DataTableEmptyStateMessage} from '@common/datatable/page/data-table-emty-state-message';
import {DatatableFilters} from '@common/datatable/page/datatable-filters';
import {
  DatatablePageHeaderBar,
  DatatablePageScrollContainer,
  DatatablePageWithHeaderBody,
  DatatablePageWithHeaderLayout,
} from '@common/datatable/page/datatable-page-with-header-layout';
import {DeleteSelectedItemsAction} from '@common/datatable/page/delete-selected-items-action';
import {useDatatableQuery} from '@common/datatable/requests/use-datatable-query';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {Table} from '@common/ui/tables/table';
import {Breadcrumb} from '@ui/breadcrumbs/breadcrumb';
import {BreadcrumbItem} from '@ui/breadcrumbs/breadcrumb-item';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {Chip} from '@ui/forms/input-field/chip-field/chip';
import {Item} from '@ui/forms/listbox/item';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {CloseIcon} from '@ui/icons/material/Close';
import {EditIcon} from '@ui/icons/material/Edit';
import {KeyboardArrowDownIcon} from '@ui/icons/material/KeyboardArrowDown';
import {Menu, MenuTrigger} from '@ui/menu/menu-trigger';
import {useContext} from 'react';
import {Link, useLocation} from 'react-router';

const columns: ColumnConfig<AiAgentSnippet>[] = [
  {
    key: 'name',
    width: 'flex-3 min-w-200',
    visibleInMode: 'all',
    header: () => <Trans message="Title" />,
    body: snippet => (
      <Link
        to={`../knowledge/snippets/${snippet.id}/edit${location.search}`}
        className="hover:underline"
      >
        {snippet.title}
      </Link>
    ),
  },
  {
    key: 'fully_scanned',
    allowsSorting: true,
    width: 'w-144 flex-shrink-0',
    header: () => <Trans message="Status" />,
    body: snippet => {
      if (snippet.scan_pending) {
        return (
          <Chip color="danger" size="xs">
            <Trans message="Scan pending" />
          </Chip>
        );
      }
      return (
        <Chip color="positive" size="xs">
          <Trans message="Scanned" />
        </Chip>
      );
    },
  },
  {
    key: 'used_by_ai_agent',
    allowsSorting: true,
    width: 'w-100 flex-shrink-0',
    header: () => <Trans message="AI agent" />,
    body: snippet =>
      snippet.used_by_ai_agent ? (
        <CheckIcon size="md" className="text-positive" />
      ) : (
        <CloseIcon size="md" className="text-muted" />
      ),
  },
  {
    key: 'created_at',
    allowsSorting: true,
    width: 'w-144',
    header: () => <Trans message="Scan date" />,
    body: snippet => (
      <time>
        <FormattedDate date={snippet.created_at} />
      </time>
    ),
  },
  {
    key: 'actions',
    header: () => <Trans message="Actions" />,
    width: 'w-42 flex-shrink-0',
    hideHeader: true,
    align: 'end',
    visibleInMode: 'all',
    body: snippet => (
      <div className="text-muted">
        <IconButton
          size="md"
          elementType={Link}
          to={`../knowledge/snippets/${snippet.id}/edit${location.search}`}
          disabled={snippet.scan_pending}
        >
          <EditIcon />
        </IconButton>
      </div>
    ),
  },
];

const filters: BackendFilter[] = [
  {
    key: 'scan_pending',
    label: message('Fully scanned'),
    description: message('Whether snippet is fully scanned'),
    defaultOperator: FilterOperator.eq,
    control: {
      type: FilterControlType.Select,
      defaultValue: '0',
      options: [
        {value: true, label: 'No', key: '1'},
        {value: false, label: 'Yes', key: '0'},
      ],
    },
  },
  createdAtFilter({
    label: message('Creation date'),
    description: message('Date snippet was created'),
  }),
];

export function Component() {
  const location = useLocation();
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery(aiAgentQueries.snippets.index(searchParams));

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <StaticPageTitle>
        <Trans message="Snippets" />
      </StaticPageTitle>
      <DatatablePageHeaderBar showSidebarToggleButton>
        <Breadcrumb size="xl">
          <BreadcrumbItem to={`../knowledge${location.search}`}>
            <Trans message="Knowledge" />
          </BreadcrumbItem>
          <BreadcrumbItem to={`../knowledge/snippets${location.search}`}>
            <Trans message="Snippets" />
          </BreadcrumbItem>
        </Breadcrumb>
      </DatatablePageHeaderBar>
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          filters={filters}
          actions={<Actions />}
          selectedActions={<SelectedActions />}
        />
        <DatatableFilters filters={filters} />
        <DatatablePageScrollContainer>
          <Table
            columns={columns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            cellHeight="h-64"
          />
          {query.isEmpty ? (
            <DataTableEmptyStateMessage
              isFiltering={isFiltering}
              image={onlineArticlesImg}
              title={<Trans message="No snippets have been created yet" />}
              filteringTitle={<Trans message="No matching snippets" />}
            />
          ) : null}
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

function Actions() {
  return (
    <DataTableAddItemButton elementType={Link} to="new">
      <Trans message="Add snippet" />
    </DataTableAddItemButton>
  );
}

function SelectedActions() {
  return (
    <div className="flex gap-8">
      <ChangeStateButton />
      <DeleteSelectedItemsAction />
    </div>
  );
}
function ChangeStateButton() {
  const ingestSnippets = useIngestSnippets();
  const uningestSnippets = useUningestSnippets();
  const {selectedRows, setSelectedRows} = useContext(DataTableContext);
  return (
    <MenuTrigger>
      <Button
        variant="flat"
        color="chip"
        endIcon={<KeyboardArrowDownIcon />}
        disabled={ingestSnippets.isPending || uningestSnippets.isPending}
      >
        <Trans message="Change AI agent state" />
      </Button>
      <Menu>
        <Item
          value="enable"
          startIcon={<CheckIcon size="sm" />}
          onSelected={() =>
            ingestSnippets.mutate(
              {snippetIds: selectedRows},
              {onSuccess: () => setSelectedRows([])},
            )
          }
        >
          <Trans message="Enable for AI agent" />
        </Item>
        <Item
          value="disable"
          startIcon={<CloseIcon size="sm" />}
          onSelected={() =>
            uningestSnippets.mutate(
              {snippetIds: selectedRows},
              {onSuccess: () => setSelectedRows([])},
            )
          }
        >
          <Trans message="Disable for AI agent" />
        </Item>
      </Menu>
    </MenuTrigger>
  );
}
