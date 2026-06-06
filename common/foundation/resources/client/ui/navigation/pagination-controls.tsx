import {
  hasNextPage,
  hasPreviousPage,
  LengthAwarePaginationResponse,
  PaginationResponse,
  SimplePaginationResponse,
} from '@common/http/backend-response/pagination-response';
import {scrollToTop} from '@common/ui/navigation/use-scroll-to-top';
import {Button, ButtonProps} from '@ui/buttons/button';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {Trans} from '@ui/i18n/trans';
import {FirstPageIcon} from '@ui/icons/material/FirstPage';
import {KeyboardArrowLeftIcon} from '@ui/icons/material/KeyboardArrowLeft';
import {KeyboardArrowRightIcon} from '@ui/icons/material/KeyboardArrowRight';
import clsx from 'clsx';
import memoize from 'nano-memoize';
import {useMemo, useRef} from 'react';
import {Link, useSearchParams} from 'react-router';

export type PaginationControlsType = 'simple' | 'lengthAware';

interface Props {
  pagination: PaginationResponse<unknown> | undefined;
  className?: string;
  type?: PaginationControlsType;
  scrollToTop?: boolean;
}
export function PaginationControls({
  pagination,
  className,
  type,
  scrollToTop,
}: Props) {
  if (
    !pagination?.data?.length ||
    (!hasNextPage(pagination) && !hasPreviousPage(pagination))
  ) {
    return null;
  }

  const isLengthAware =
    (!type || type === 'lengthAware') &&
    'total' in pagination &&
    pagination.total != null;

  if (isLengthAware) {
    return (
      <LengthAwarePagination
        data={pagination as LengthAwarePaginationResponse}
        className={className}
        scrollToTop={scrollToTop}
      />
    );
  }

  return (
    <SimplePagination
      data={pagination as SimplePaginationResponse}
      className={className}
      scrollToTop={scrollToTop}
    />
  );
}

interface LengthAwarePaginationProps {
  data: LengthAwarePaginationResponse;
  className?: string;
  scrollToTop?: boolean;
}
function LengthAwarePagination({
  data,
  className,
  scrollToTop: shouldScrollToTop,
}: LengthAwarePaginationProps) {
  const ref = useRef<HTMLElement>(null);
  const currentPage = data.current_page;
  const total = data.total;
  const perPage = data.per_page;

  const range = generatePaginationRangeWithDots(currentPage, total, perPage);

  return (
    <nav
      ref={ref}
      className={clsx('flex flex-wrap items-center justify-center', className)}
    >
      <ul className="flex items-center gap-4">
        {range.map((item, index) => {
          const isCurrentPage = item === currentPage;
          return (
            <li key={item === '...' ? `...-${index}` : item}>
              <PaginationButton
                page={!isCurrentPage ? item : undefined}
                elementType={isCurrentPage ? undefined : Link}
                replace
                variant={isCurrentPage ? 'outline' : undefined}
                disabled={isCurrentPage || item === '...'}
                onClick={shouldScrollToTop ? () => scrollToTop(ref) : undefined}
              >
                {item === '...' ? item : <FormattedNumber value={+item} />}
              </PaginationButton>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface PaginationButtonProps extends Exclude<ButtonProps, 'to'> {
  page: number | string | undefined;
}
function PaginationButton({page, ...other}: PaginationButtonProps) {
  const [searchParams] = useSearchParams();
  const search = useMemo(() => {
    if (!page) {
      return null;
    }
    searchParams.set('page', `${page}`);
    return searchParams.toString();
  }, [page, searchParams]);

  return <Button to={search ? {search} : undefined} {...other} />;
}

interface SimplePaginationProps {
  data: SimplePaginationResponse<unknown>;
  className?: string;
  scrollToTop?: boolean;
}
function SimplePagination({
  data,
  className,
  scrollToTop: shouldScrollToTop,
}: SimplePaginationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const currentPage = data.current_page;
  const isLastPage = !hasNextPage(data);
  return (
    <div ref={ref} className={clsx('flex items-center gap-12', className)}>
      {currentPage > 1 && (
        <PaginationButton
          variant="outline"
          elementType={Link}
          className="min-w-110"
          page={1}
          replace
          startIcon={<FirstPageIcon />}
          onClick={shouldScrollToTop ? () => scrollToTop(ref) : undefined}
          size="xs"
        >
          <Trans message="First" />
        </PaginationButton>
      )}
      <PaginationButton
        variant="outline"
        elementType={currentPage == 1 ? undefined : Link}
        disabled={currentPage == 1}
        className="mr-auto min-w-110"
        page={currentPage == 1 ? undefined : currentPage - 1}
        replace={currentPage == 1 ? undefined : true}
        startIcon={<KeyboardArrowLeftIcon />}
        onClick={shouldScrollToTop ? () => scrollToTop(ref) : undefined}
        size="xs"
      >
        <Trans message="Previous" />
      </PaginationButton>
      <PaginationButton
        variant="outline"
        elementType={isLastPage ? undefined : Link}
        disabled={isLastPage}
        className="min-w-110"
        page={isLastPage ? undefined : currentPage + 1}
        replace={isLastPage ? undefined : true}
        endIcon={<KeyboardArrowRightIcon />}
        onClick={shouldScrollToTop ? () => scrollToTop(ref) : undefined}
        size="xs"
      >
        <Trans message="Next" />
      </PaginationButton>
    </div>
  );
}

const generatePaginationRangeWithDots = memoize(
  (currentPage: number, total: number, perPage: number) => {
    const totalPages = Math.ceil(total / perPage);
    const delta = 3;
    const range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }
    range.unshift(1);
    range.push(totalPages);
    return range;
  },
);
