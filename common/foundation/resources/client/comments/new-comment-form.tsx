import {useAuth} from '@common/auth/use-auth';
import {Comment} from '@common/comments/comment';
import {Commentable} from '@common/comments/commentable';
import {useCreateComment} from '@common/comments/requests/use-create-comment';
import {useObjectRef} from '@react-aria/utils';
import {Avatar} from '@ui/avatar/avatar';
import {Button} from '@ui/buttons/button';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {useTrans} from '@ui/i18n/use-trans';
import {useIsMobileMediaQuery} from '@ui/utils/hooks/is-mobile-media-query';
import clsx from 'clsx';
import {RefObject, useState} from 'react';

export interface NewCommentFormProps {
  commentable: Commentable;
  inReplyTo?: Comment;
  onSuccess?: () => void;
  className?: string;
  autoFocus?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  // additional data that should be sent to backend when creating comments
  payload?: Record<string, number | string>;
}
export function NewCommentForm({
  commentable,
  inReplyTo,
  onSuccess,
  className,
  autoFocus,
  payload,
  ...props
}: NewCommentFormProps) {
  const {trans} = useTrans();
  const {user} = useAuth();
  const createComment = useCreateComment();
  const isMobile = useIsMobileMediaQuery();
  const inputRef = useObjectRef<HTMLInputElement>(props.inputRef);
  const [inputIsExpanded, setInputIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const clearInput = () => {
    setInputIsExpanded(false);
    if (inputRef.current) {
      inputRef.current.blur();
      setInputValue('');
    }
  };

  return (
    <form
      className={clsx('flex gap-24 py-6', className)}
      onSubmit={e => {
        e.preventDefault();
        if (inputValue && !createComment.isPending) {
          createComment.mutate(
            {
              ...payload,
              commentable,
              content: inputValue,
              inReplyTo,
            },
            {
              onSuccess: () => {
                clearInput();
                onSuccess?.();
              },
            },
          );
        }
      }}
    >
      <Avatar
        size={isMobile ? 'lg' : 'xl'}
        circle
        src={user?.image}
        label={user?.name}
      />
      <div className="flex-auto">
        <div className="mb-10 text-xs text-muted">
          <Trans
            message="Comment as :name"
            values={{
              name: <span className="font-medium text">{user?.name}</span>,
            }}
          />
        </div>
        <TextField
          inputRef={inputRef}
          autoFocus={autoFocus}
          inputElementType="textarea"
          inputClassName="resize-none"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onFocus={() => setInputIsExpanded(true)}
          onBlur={() => {
            if (!inputValue) {
              setInputIsExpanded(false);
            }
          }}
          minLength={3}
          rows={inputIsExpanded ? 3 : 1}
          placeholder={
            inReplyTo
              ? trans(message('Write a reply'))
              : trans(message('Leave a comment'))
          }
        />
        {inputIsExpanded && (
          <div className="mt-12 flex items-center justify-end gap-12">
            <Button variant="outline" onClick={() => clearInput()}>
              <Trans message="Cancel" />
            </Button>
            <Button
              variant="outline"
              color="primary"
              type="submit"
              disabled={createComment.isPending || inputValue.length < 3}
            >
              <Trans message="Comment" />
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
