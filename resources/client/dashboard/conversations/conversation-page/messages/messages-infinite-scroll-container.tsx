import {InfiniteScrollSentinel} from '@common/ui/infinite-scroll/infinite-scroll-sentinel';
import {isScrollable} from '@react-aria/utils';
import {UseInfiniteQueryResult} from '@tanstack/react-query';
import {observeSize} from '@ui/utils/dom/observe-size';
import clsx from 'clsx';
import debounce from 'just-debounce-it';
import {Fragment, ReactNode, useCallback, useEffect, useRef} from 'react';

const detachedOffset = 10;

interface Props {
  children: ReactNode;
  className?: string;
  query: UseInfiniteQueryResult<{items: {id: string | number}[]}> | null;
  messageIds?: string;
}
export function MessagesInfiniteScrollContainer({
  children,
  className,
  query,
  messageIds,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const prevScrollValue = useRef<number>(0);
  const prevContainerHeight = useRef<number>(null);
  const isDetached = useRef(false);
  const prevMessageIds = useRef<string[] | null>(null);

  const messageIdsString = messageIds
    ? messageIds
    : query?.data?.items.map(m => m.id).join(',');

  const updateScroll = useCallback(
    ({amount, force}: {amount?: number; force?: boolean} = {}) => {
      if (!scrollParentRef.current) return;

      if (isDetached.current && !force) return;

      scrollParentRef.current.scrollTo({
        top: amount ?? scrollParentRef.current.scrollHeight,
      });
    },
    [],
  );

  // if message ids change, it means new messages were added and we will
  // want to force the scroll to top or bottom, even if detached
  useEffect(() => {
    if (!messageIdsString) return;

    const messageIds = messageIdsString.split(',');

    if (!prevMessageIds.current) {
      prevMessageIds.current = messageIds;
      return;
    }

    const lastMessageId = prevMessageIds.current.at(-1);
    const lastMessageLength = prevMessageIds.current.length;

    // new messages added to the bottom
    if (lastMessageId !== messageIds.at(-1)) {
      updateScroll({force: true});

      // new messages added to the top via infinite scroll
    } else {
      // only scroll to top if there are actually more messages then before,
      // this will prevent accidentally scrolling due to placeholder messages
      if (lastMessageLength >= messageIds.length) {
        return;
      }

      const scrollEl = scrollParentRef.current;
      const containerEl = containerRef.current;
      const prevHeight = prevContainerHeight.current;
      if (!scrollEl || !containerEl || !prevHeight) return;

      const currentHeight = containerEl.getBoundingClientRect().height;
      if (prevHeight !== currentHeight) {
        updateScroll({amount: currentHeight - prevHeight, force: true});
        prevContainerHeight.current = currentHeight;
      }
    }

    prevMessageIds.current = messageIds;
  }, [messageIdsString]);

  useEffect(() => {
    if (!scrollParentRef.current) return;
    const scrollParent = scrollParentRef.current;

    // if multiple scrolls fire quickly due to container height changes,
    // it will cause detach, so we need to debounce.
    const handleScroll = debounce(() => {
      // if user scrolled up, we detach
      if (scrollParent.scrollTop < prevScrollValue.current) {
        isDetached.current = true;
      }
      // if user scrolled back to within 10px of bottom, we reattach
      if (
        scrollParent.scrollTop -
          (scrollParent.scrollHeight - scrollParent.clientHeight) >=
        -detachedOffset
      ) {
        isDetached.current = false;
      }

      prevScrollValue.current = scrollParent.scrollTop;
    }, 10);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateScroll();
      }
    };

    scrollParent.addEventListener('scroll', handleScroll);

    // resize observer will not fire while tab is inactive, need to scroll to bottom after tab is focused
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // observe changes to height and scroll to bottom if height changes.
    // this will cover streaming messages when messageIdsString does not change,
    // but message content/height changes, as well as browser window size changes
    const unobserve = observeSize(containerRef, ({height}) => {
      if (Math.ceil(prevContainerHeight.current ?? 0) === Math.ceil(height)) {
        return;
      }
      prevContainerHeight.current = height;
      updateScroll();
    });

    return () => {
      scrollParent.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      unobserve();
    };
  }, [updateScroll]);

  return (
    <Fragment>
      {query ? (
        <InfiniteScrollSentinel
          query={query}
          className={clsx(query.hasNextPage && 'h-64 py-16')}
          loaderMarginTop="m-0"
        />
      ) : null}
      <div
        ref={el => {
          if (el) {
            scrollParentRef.current = findScrollParent(el);
            containerRef.current = el;
            if (scrollParentRef.current) {
              prevScrollValue.current = scrollParentRef.current.scrollTop;
            }
          }
        }}
        className={className}
        id="feed-container"
      >
        {children}
      </div>
    </Fragment>
  );
}

function findScrollParent(el: HTMLDivElement): HTMLDivElement | null {
  if (!el) return null;

  if (isScrollable(el)) return el;

  return findScrollParent(el.parentElement as HTMLDivElement);
}
