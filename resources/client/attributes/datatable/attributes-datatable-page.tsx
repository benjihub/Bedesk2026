import {AdminDocsUrls} from '@app/admin/admin-config';
import {AttributesDatatableFilters} from '@app/attributes/datatable/attributes-datatable-filters';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {DocsLink} from '@common/admin/settings/layout/settings-links';
import {GlobalLoadingProgress} from '@common/core/global-loading-progress';
import {DataTableAddItemButton} from '@common/datatable/data-table-add-item-button';
import {DataTableHeader} from '@common/datatable/data-table-header';
import {DataTablePaginationFooter} from '@common/datatable/data-table-pagination-footer';
import {useDatatableSearchParams} from '@common/datatable/filters/utils/use-datatable-search-params';
import {validateDatatableSearch} from '@common/datatable/filters/utils/validate-datatable-search';
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
import {useNavigate} from '@common/ui/navigation/use-navigate';
import {Table} from '@common/ui/tables/table';
import {Trans} from '@ui/i18n/trans';
import {Link} from 'react-router';
import {AttributesDatatableColumns} from './attributes-datatable-columns';
import textFieldImage from './text-field.svg';

export function Component() {
  const navigate = useNavigate();
  const {
    searchParams,
    sortDescriptor,
    mergeIntoSearchParams,
    setSearchQuery,
    isFiltering,
  } = useDatatableSearchParams(validateDatatableSearch);

  const query = useDatatableQuery(
    helpdeskQueries.attributes.index(searchParams),
  );

  const actions = (
    <DataTableAddItemButton elementType={Link} to="new">
      <Trans message="Add attribute" />
    </DataTableAddItemButton>
  );

  return (
    <DatatablePageWithHeaderLayout>
      <GlobalLoadingProgress query={query} />
      <StaticPageTitle>
        <Trans message="Attributes" />
      </StaticPageTitle>
      <DatatablePageHeaderBar
        title={<Trans message="Attributes" />}
        showSidebarToggleButton
        rightContent={
          <DocsLink
            variant="button"
            link={AdminDocsUrls.pages.attributes}
            size="xs"
          />
        }
      />
      <DatatablePageWithHeaderBody>
        <DataTableHeader
          searchValue={searchParams.query}
          onSearchChange={setSearchQuery}
          actions={actions}
          filters={AttributesDatatableFilters}
        />
        <DatatableFilters filters={AttributesDatatableFilters} />
        <DatatablePageScrollContainer>
          <Table
            columns={AttributesDatatableColumns}
            data={query.items}
            sortDescriptor={sortDescriptor}
            onSortChange={mergeIntoSearchParams}
            enableSelection={false}
            cellHeight="h-64"
            onAction={item => {
              navigate(`${item.id}/edit`);
            }}
          />
          {query.isEmpty && (
            <DataTableEmptyStateMessage
              className="mt-44"
              isFiltering={isFiltering}
              image={textFieldImage}
              title={
                <Trans message="No custom attributes have been created yet" />
              }
              filteringTitle={<Trans message="No matching attributes" />}
            />
          )}
          <DataTablePaginationFooter
            hideIfOnlyOnePage
            query={query}
            onPageChange={page => mergeIntoSearchParams({page})}
            onPerPageChange={perPage => mergeIntoSearchParams({perPage})}
          />
        </DatatablePageScrollContainer>
      </DatatablePageWithHeaderBody>
    </DatatablePageWithHeaderLayout>
  );
}
