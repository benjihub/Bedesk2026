import {useAuth} from '@common/auth/use-auth';
import {UserAvatar} from '@common/auth/user-avatar';
import {Comment} from '@common/comments/comment';
import {Commentable} from '@common/comments/commentable';
import {NewCommentForm} from '@common/comments/new-comment-form';
import {useDeleteComments} from '@common/comments/requests/use-delete-comments';
import {SiteConfigContext} from '@common/core/settings/site-config-context';
import {queryClient} from '@common/http/query-client';
import {useSubmitReport} from '@common/reports/requests/use-submit-report';
import {ThumbButtons} from '@common/votes/thumb-buttons';
import {Avatar} from '@ui/avatar/avatar';
import {Button} from '@ui/buttons/button';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedDuration} from '@ui/i18n/formatted-duration';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {MoreVertIcon} from '@ui/icons/material/MoreVert';
import {ReplyIcon} from '@ui/icons/material/Reply';
import {Menu, MenuItem, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {User} from '@ui/types/user';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import {Fragment, memo, useContext, useState} from 'react';
import {Link} from 'react-router';

interface CommentListItemProps {
  comment: Comment;
  commentable: Commentable;
  canDelete?: boolean;
}
export function CommentListItem({
  comment,
  commentable,
  // user can delete comment if they have created it, or they have relevant permissions on commentable
  canDelete,
}: CommentListItemProps) {
  const isMobile = useIsMobileMediaQuery();
  const {user, hasPermission} = useAuth();
  const [replyFormVisible, setReplyFormVisible] = useState(false);
  const showReplyButton =
    user != null &&
    !comment.deleted &&
    comment.depth < 5 &&
    hasPermission('comments.create');

  return (
    <div style={{paddingLeft: `${comment.depth * 20}px`}}>
      <div className="group flex min-h-70 items-start gap-24 py-18">
        {comment.user ? (
          <UserAvatar
            user={comment.user}
            size={isMobile ? 'lg' : 'xl'}
            circle
          />
        ) : (
          <Avatar label="User" />
        )}
        <div className="flex-auto text-sm">
          <div className="mb-4 flex items-center gap-8">
            {comment.user && <UserDisplayName user={comment.user} />}
            <time className="text-xs text-muted">
              <FormattedRelativeTime date={comment.created_at} />
            </time>
            {comment.position ? (
              <Position commentable={commentable} position={comment.position} />
            ) : null}
          </div>
          <div className="whitespace-pre-line">
            {comment.deleted ? (
              <span className="italic text-muted">
                <Trans message="[COMMENT DELETED]" />
              </span>
            ) : (
              comment.content
            )}
          </div>
          {!comment.deleted && (
            <div className="-ml-8 mt-10 flex items-center gap-8">
              {showReplyButton && (
                <div className="contents">
                  <Button
                    className="max-md:hidden"
                    sizeClassName="text-sm px-8 py-4"
                    startIcon={<ReplyIcon />}
                    onClick={() => setReplyFormVisible(!replyFormVisible)}
                  >
                    <Trans message="Reply" />
                  </Button>
                  <IconButton
                    className="md:hidden"
                    onClick={() => setReplyFormVisible(!replyFormVisible)}
                  >
                    <ReplyIcon />
                  </IconButton>
                </div>
              )}
              <ThumbButtons model={comment} showUpvotesOnly />
              <CommentOptionsTrigger
                comment={comment}
                canDelete={canDelete}
                user={user}
              />
            </div>
          )}
        </div>
      </div>
      {replyFormVisible ? (
        <NewCommentForm
          className={!comment?.depth ? 'pl-20' : undefined}
          commentable={commentable}
          inReplyTo={comment}
          autoFocus
          onSuccess={() => {
            setReplyFormVisible(false);
          }}
        />
      ) : null}
    </div>
  );
}

interface PositionProps {
  commentable: Commentable;
  position: number;
}
const Position = memo(({commentable, position}: PositionProps) => {
  if (!commentable.duration) return null;
  const seconds = (position / 100) * (commentable.duration / 1000);
  return (
    <span className="text-xs text-muted">
      <Trans
        message="at :position"
        values={{
          position: <FormattedDuration seconds={seconds} />,
        }}
      />
    </span>
  );
});

interface DeleteCommentsButtonProps {
  comment: Comment;
  canDelete?: boolean;
  user: User | null;
}
export function CommentOptionsTrigger({
  comment,
  canDelete,
  user,
}: DeleteCommentsButtonProps) {
  const deleteComments = useDeleteComments();
  const reportComment = useSubmitReport(comment);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const showDeleteButton =
    (comment.user_id === user?.id || canDelete) && !comment.deleted;

  const handleReport = () => {
    reportComment.mutate({});
  };

  const handleDelete = (isConfirmed: boolean) => {
    setIsDeleteDialogOpen(false);
    if (isConfirmed) {
      deleteComments.mutate(
        {commentIds: [comment.id]},
        {
          onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['comment']});
          },
        },
      );
    }
  };

  return (
    <Fragment>
      <MenuTrigger>
        <Button startIcon={<MoreVertIcon />} sizeClassName="text-sm px-8 py-4">
          <Trans message="More" />
        </Button>
        <Menu>
          <MenuItem value="report" onSelected={() => handleReport()}>
            <Trans message="Report comment" />
          </MenuItem>
          {showDeleteButton && (
            <MenuItem
              value="delete"
              onSelected={() => setIsDeleteDialogOpen(true)}
            >
              <Trans message="Delete" />
            </MenuItem>
          )}
        </Menu>
      </MenuTrigger>
      <DialogTrigger
        type="modal"
        isOpen={isDeleteDialogOpen}
        onClose={isConfirmed => handleDelete(isConfirmed)}
      >
        <ConfirmationDialog
          isDanger
          title={<Trans message="Delete comment?" />}
          body={
            <Trans message="Are you sure you want to delete this comment?" />
          }
          confirm={<Trans message="Delete" />}
        />
      </DialogTrigger>
    </Fragment>
  );
}

interface UserDisplayNameProps {
  user: User;
}
function UserDisplayName({user}: UserDisplayNameProps) {
  const {auth} = useContext(SiteConfigContext);
  if (auth?.getUserProfileLink) {
    return (
      <Link
        to={auth.getUserProfileLink(user)}
        className="text-base font-medium hover:underline"
      >
        {user.name}
      </Link>
    );
  }
  return <div className="text-base font-medium">{user.name}</div>;
}
