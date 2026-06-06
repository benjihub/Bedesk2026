import {UseSuspenseInfiniteQueryResult} from '@tanstack/react-query';
import {UseInfiniteQueryResult} from '@tanstack/react-query/src/types';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {ProgressCircle} from '@ui/progress/progress-circle';
import clsx from 'clsx';
import {AnimatePresence, m} from 'framer-motion';
import React, {ReactNode, useEffect, useRef, useState} from 'react';

export interface InfiniteScrollSentinelProps {
  loaderMarginTop?: string;
  children?: ReactNode;
  loadMoreExtraContent?: ReactNode;
  query: UseInfiniteQueryResult | UseSuspenseInfiniteQueryResult;
  style?: React.CSSProperties;
  className?: string;
  variant?: 'infiniteScroll' | 'loadMore';
  size?: 'sm' | 'md';
}
export function InfiniteScrollSentinel({
  query: {isInitialLoading, fetchNextPage, isFetchingNextPage, hasNextPage},
  children,
  loaderMarginTop = 'mt-24',
  style,
  className,
  variant: _variant = 'infiniteScroll',
  loadMoreExtraContent,
  size = 'sm',
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoading = isFetchingNextPage || isInitialLoading;
  const [loadMoreClickCount, setLoadMoreClickCount] = useState(0);
  const innerVariant =
    _variant === 'loadMore' && loadMoreClickCount < 3
      ? 'loadMore'
      : 'infiniteScroll';

  // don't lazy load unless sentinel has left the view after last lazy load
  // 1. will prevent lazy loading until initial data is rendered and pushes sentinel out of view
  // 2. when sentinel is top (chat interface) prevent load until container is scrolled to the bottom
  // 3. when sentinel is bottom, prevent double lazy load if "isLoading" is false, but sentinel is still in view
  const leftViewAfterLoading = useRef(false);

  useEffect(() => {
    const sentinelEl = sentinelRef.current;
    if (!sentinelEl || innerVariant === 'loadMore') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!leftViewAfterLoading.current) return;

        if (hasNextPage && !isLoading) {
          leftViewAfterLoading.current = false;
          fetchNextPage();
        }
      } else {
        leftViewAfterLoading.current = true;
      }
    });

    observer.observe(sentinelEl);
    return () => {
      observer.unobserve(sentinelEl);
    };
  }, [fetchNextPage, hasNextPage, isLoading, innerVariant]);

  let content: ReactNode;

  if (children) {
    // children might already be wrapped in AnimatePresence, so only wrap default loader with it
    content = isFetchingNextPage ? children : null;
  } else if (innerVariant === 'loadMore') {
    content = !isInitialLoading && hasNextPage && (
      <div className={clsx('flex items-center gap-8', loaderMarginTop)}>
        {loadMoreExtraContent}
        <Button
          size={size === 'md' ? 'sm' : 'xs'}
          className={clsx(
            size === 'sm' ? 'min-h-24 min-w-96' : 'min-h-36 min-w-112',
          )}
          variant="outline"
          color="primary"
          onClick={() => {
            fetchNextPage();
            setLoadMoreClickCount(loadMoreClickCount + 1);
          }}
          disabled={isLoading}
        >
          {loadMoreClickCount >= 2 && !isFetchingNextPage ? (
            <Trans message="Load all" />
          ) : (
            <Trans message="Show more" />
          )}
        </Button>
      </div>
    );
  } else {
    content = (
      <AnimatePresence>
        {isFetchingNextPage && (
          <m.div
            className={clsx('flex w-full justify-center', loaderMarginTop)}
            {...opacityAnimation}
          >
            <ProgressCircle size={size} isIndeterminate aria-label="loading" />
          </m.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div
      style={style}
      className={clsx('w-full', className, hasNextPage && 'min-h-36')}
      role="presentation"
    >
      <div ref={sentinelRef} aria-hidden />
      {content}
    </div>
  );
}
