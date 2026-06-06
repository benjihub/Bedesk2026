import {UserAvatar} from '@common/auth/user-avatar';
import {Comment} from '@common/comments/comment';
import {DeleteCommentsButton} from '@common/comments/comments-datatable-page/delete-comments-button';
import {RestoreCommentsButton} from '@common/comments/comments-datatable-page/restore-comments-button';
import {useUpdateComment} from '@common/comments/requests/use-update-comment';
import {SiteConfigContext} from '@common/core/settings/site-config-context';
import {queryClient} from '@common/http/query-client';
import {Avatar} from '@ui/avatar/avatar';
import {Button} from '@ui/buttons/button';
import {LinkStyle} from '@ui/buttons/external-link';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Checkbox} from '@ui/forms/toggle/checkbox';
import {FormattedRelativeTime} from '@ui/i18n/formatted-relative-time';
import {Trans} from '@ui/i18n/trans';
import {NormalizedModel} from '@ui/types/normalized-model';
import {User} from '@ui/types/user';
import clsx from 'clsx';
import {Fragment, useContext, useState} from 'react';
import {Link} from 'react-router';

interface Props {
  comment: Comment;
  isSelected: boolean;
  onToggle: () => void;
}
export function CommentDatatableItem({comment, isSelected, onToggle}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  return (
    <div className={clsx('border-b p-14', comment.deleted && 'bg-danger/6')}>
      {comment.commentable && (
        <CommentableHeader
          isSelected={isSelected}
          onToggle={onToggle}
          commentable={comment.commentable}
        />
      )}
      <div className="flex items-start gap-10 pt-14 md:pl-20">
        {comment.user ? (
          <UserAvatar className="flex-shrink-0" user={comment.user} size="md" />
        ) : (
          <Avatar className="flex-shrink-0" label="User" />
        )}
        <div className="flex-auto">
          <CommentHeader comment={comment} />
          {isEditing ? (
            <EditCommentForm
              comment={comment}
              onClose={isSaved => {
                setIsEditing(false);
                if (isSaved) {
                  queryClient.invalidateQueries({queryKey: ['comment']});
                }
              }}
            />
          ) : (
            <Fragment>
              <div className="my-14 text-sm">{comment.content}</div>
              <div className="flex items-center justify-between gap-24">
                <div>
                  {comment.deleted ? (
                    <RestoreCommentsButton commentIds={[comment.id]} />
                  ) : (
                    <DeleteCommentsButton commentIds={[comment.id]} />
                  )}
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setIsEditing(true);
                    }}
                  >
                    <Trans message="Edit" />
                  </Button>
                </div>
                <div className="text-xs text-danger">
                  <Trans
                    message="Reported [one 1 time|other :count times]"
                    values={{count: comment.reports_count}}
                  />
                </div>
              </div>
            </Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

interface CommentableHeaderProps {
  isSelected: boolean;
  onToggle: Props['onToggle'];
  commentable: NormalizedModel;
}
function CommentableHeader({
  isSelected,
  onToggle,
  commentable,
}: CommentableHeaderProps) {
  return (
    <div className="flex items-center">
      <div className="mr-14">
        <Checkbox checked={isSelected} onChange={() => onToggle()} />
      </div>
      {commentable.image && (
        <img
          className="mr-6 h-20 w-20 overflow-hidden rounded object-cover"
          src={commentable.image}
          alt=""
        />
      )}
      <div className="mr-4 text-sm">{commentable.name}</div>
      <div className="text-xs text-muted">({commentable.model_type})</div>
    </div>
  );
}

interface CommentHeaderProps {
  comment: Comment;
}
function CommentHeader({comment}: CommentHeaderProps) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div>
        {comment.user && <UserDisplayName user={comment.user} show="name" />}
      </div>
      <div>&bull;</div>
      <time>
        <FormattedRelativeTime date={comment.created_at} />
      </time>
      {comment.user && (
        <div className="ml-auto hidden md:block">
          {<UserDisplayName user={comment.user} show="email" />}
        </div>
      )}
    </div>
  );
}

interface EditCommentFormProps {
  comment: Comment;
  onClose: (saved: boolean) => void;
}
function EditCommentForm({comment, onClose}: EditCommentFormProps) {
  const [content, setContent] = useState(comment.content);
  const updateComment = useUpdateComment();
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        updateComment.mutate(
          {commentId: comment.id, content},
          {onSuccess: () => onClose(true)},
        );
      }}
    >
      <TextField
        autoFocus
        inputElementType="textarea"
        className="my-14"
        rows={2}
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <Button
        size="xs"
        variant="outline"
        color="primary"
        type="submit"
        className="mr-6"
        disabled={updateComment.isPending}
      >
        <Trans message="Save edit" />
      </Button>
      <Button
        size="xs"
        variant="outline"
        className="mr-6"
        onClick={e => onClose(false)}
        disabled={updateComment.isPending}
      >
        <Trans message="Cancel" />
      </Button>
    </form>
  );
}

interface UserDisplayNameProps {
  user: User;
  show: 'name' | 'email';
}
function UserDisplayName({user, show}: UserDisplayNameProps) {
  const {auth} = useContext(SiteConfigContext);
  if (auth?.getUserProfileLink) {
    return (
      <Link
        to={auth.getUserProfileLink(user)}
        className={LinkStyle}
        target="_blank"
      >
        {user[show]}
      </Link>
    );
  }
  return <div className="text-muted">{user[show]}</div>;
}
