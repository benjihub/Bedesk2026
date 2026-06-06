import {Comment} from '@common/comments/comment';
import {Trans} from '@ui/i18n/trans';
import {CommentIcon} from '@ui/icons/material/Comment';
import {Commentable} from '@common/comments/commentable';
import {useComments} from '@common/comments/requests/use-comments';
import {InfiniteScrollSentinel} from '@common/ui/infinite-scroll/infinite-scroll-sentinel';
import {AnimatePresence, m} from 'framer-motion';
import {opacityAnimation} from '@ui/animation/opacity-animation';
import {FormattedNumber} from '@ui/i18n/formatted-number';
import {IllustratedMessage} from '@ui/images/illustrated-message';
import {CommentListItem} from '@common/comments/comment-list/comment-list-item';
import {Skeleton} from '@ui/skeleton/skeleton';
import {ReactNode} from 'react';
import {AccountRequiredCard} from '@common/comments/comment-list/account-required-card';
import {message} from '@ui/i18n/message';

const accountRequiredMessage = message(
  'Please <l>login</l> or <r>create account</r> to comment',
);

interface CommentListProps {
  commentable: Commentable;
  canDeleteAllComments?: boolean;
  className?: string;
  children?: ReactNode;
  perPage?: number;
}
export function CommentList({
  className,
  commentable,
  canDeleteAllComments = false,
  children,
  perPage = 25,
}: CommentListProps) {
  const {items, totalItems, ...query} = useComments(commentable, {perPage});

  if (query.isError) {
    return null;
  }

  return (
    <div className={className}>
      <div className="mb-8 flex items-center gap-8 border-b pb-8">
        <CommentIcon size="sm" className="text-muted" />
        {query.isInitialLoading ? (
          <Trans message="Loading comments..." />
        ) : (
          <Trans
            message=":count comments"
            values={{count: <FormattedNumber value={totalItems || 0} />}}
          />
        )}
      </div>
      {children}
      <AccountRequiredCard message={accountRequiredMessage} />
      <AnimatePresence initial={false} mode="wait">
        {query.isInitialLoading ? (
          <CommentSkeletons count={4} />
        ) : (
          <CommentListItems
            comments={items}
            canDeleteAllComments={canDeleteAllComments}
            commentable={commentable}
          />
        )}
      </AnimatePresence>
      <InfiniteScrollSentinel query={query} variant="loadMore" />
    </div>
  );
}

interface CommentListItemsProps {
  comments: Comment[];
  canDeleteAllComments: boolean;
  commentable: Commentable;
}
function CommentListItems({
  comments,
  commentable,
  canDeleteAllComments,
}: CommentListItemsProps) {
  if (!comments.length) {
    return (
      <IllustratedMessage
        className="mt-24"
        size="sm"
        title={<Trans message="Seems a little quiet over here" />}
        description={<Trans message="Be the first to comment" />}
      />
    );
  }

  return (
    <m.div key="comments" {...opacityAnimation}>
      {comments.map(comment => (
        <CommentListItem
          key={comment.id}
          comment={comment}
          commentable={commentable}
          canDelete={canDeleteAllComments}
        />
      ))}
    </m.div>
  );
}

interface CommentSkeletonsProps {
  count: number;
}
function CommentSkeletons({count}: CommentSkeletonsProps) {
  return (
    <m.div key="loading-skeleton" {...opacityAnimation}>
      {[...new Array(count).keys()].map(index => (
        <div
          key={index}
          className="group flex min-h-70 items-start gap-24 py-18"
        >
          <Skeleton variant="avatar" radius="rounded-full" size="w-60 h-60" />
          <div className="flex-auto text-sm">
            <Skeleton className="mb-4 max-w-184 text-base" />
            <Skeleton className="text-sm" />
            <div className="mt-10 flex items-center gap-8">
              <Skeleton className="max-w-70 text-sm" />
              <Skeleton className="max-w-40 text-sm" />
              <Skeleton className="max-w-60 text-sm" />
            </div>
          </div>
        </div>
      ))}
    </m.div>
  );
}
