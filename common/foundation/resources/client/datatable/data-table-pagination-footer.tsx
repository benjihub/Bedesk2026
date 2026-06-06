import {UseQueryResult, UseSuspenseQueryResult} from '@tanstack/react-query';
import {IconButton} from '@ui/buttons/icon-button';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {Trans} from '@ui/i18n/trans';
import {useNumberFormatter} from '@ui/i18n/use-number-formatter';
import {KeyboardArrowLeftIcon} from '@ui/icons/material/KeyboardArrowLeft';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import clsx from 'clsx';
import {
  hasNextPage,
  LengthAwarePaginationResponse,
  PaginatedBackendResponse,
} from '../http/backend-response/pagination-response';

const defaultPerPage = 15;
const perPageOptions = [{key: 15}, {key: 30}, {key: 60}, {key: 100}];

type DataTablePaginationFooterProps = {
  query:
    | UseQueryResult<PaginatedBackendResponse<unknown>>
    | UseSuspenseQueryResult<PaginatedBackendResponse<unknown>>;
  onPerPageChange?: (perPage: number) => void;
  onPageChange?: (page: number) => void;
  hideIfOnlyOnePage?: boolean;
  className?: string;
};
export function DataTablePaginationFooter({
  query,
  onPerPageChange,
  onPageChange,
  hideIfOnlyOnePage,
  className,
}: DataTablePaginationFooterProps) {
  const isMobile = useIsMobileMediaQuery();
  const numberFormatter = useNumberFormatter();
  const pagination = query.data
    ?.pagination as LengthAwarePaginationResponse<any>;
  const currentPage = pagination?.current_page ? +pagination.current_page : 1;

  if (
    !pagination ||
    (hideIfOnlyOnePage && currentPage == 1 && !hasNextPage(pagination))
  )
    return null;

  const perPageSelect = onPerPageChange ? (
    <Select
      selectionMode="single"
      minWidth="min-w-auto"
      disabled={query.isLoading}
      labelPosition="side"
      size="xs"
      label={<Trans message="Items per page" />}
      selectedValue={
        pagination.per_page ? +pagination.per_page : defaultPerPage
      }
      onSelectionChange={value => onPerPageChange(value as number)}
    >
      {perPageOptions.map(option => (
        <Item key={option.key} value={option.key}>
          {option.key}
        </Item>
      ))}
    </Select>
  ) : null;

  return (
    <div
      className={clsx(
        'flex h-54 select-none items-center justify-end gap-20 px-20',
        className,
      )}
    >
      {!isMobile && perPageSelect}
      {pagination.from && pagination.to && 'total' in pagination ? (
        <div className="text-sm">
          <Trans
            message=":from - :to of :total"
            values={{
              from: pagination.from,
              to: pagination.to,
              total: numberFormatter.format(pagination.total),
            }}
          />
        </div>
      ) : null}
      <div className="text-muted">
        <IconButton
          disabled={query.isFetching || currentPage < 2}
          onClick={() => {
            onPageChange?.(currentPage - 1);
          }}
        >
          <KeyboardArrowLeftIcon />
        </IconButton>
        <IconButton
          disabled={query.isFetching || !hasNextPage(pagination)}
          onClick={() => {
            onPageChange?.(currentPage + 1);
          }}
        >
          <KeyboardArrowRightIcon />
        </IconButton>
      </div>
    </div>
  );
}
