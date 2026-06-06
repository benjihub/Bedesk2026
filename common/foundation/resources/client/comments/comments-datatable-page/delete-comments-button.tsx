import {useDeleteComments} from '@common/comments/requests/use-delete-comments';
import {queryClient} from '@common/http/query-client';
import {Button} from '@ui/buttons/button';
import {ButtonSize} from '@ui/buttons/button-size';
import {ButtonVariant} from '@ui/buttons/get-shared-button-style';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';

interface DeleteCommentsButtonProps {
  commentIds: number[];
  variant?: ButtonVariant;
  size?: ButtonSize;
}
export function DeleteCommentsButton({
  commentIds,
  variant = 'outline',
  size = 'xs',
}: DeleteCommentsButtonProps) {
  const deleteComments = useDeleteComments();
  return (
    <DialogTrigger
      type="modal"
      onClose={isConfirmed => {
        if (isConfirmed) {
          deleteComments.mutate(
            {commentIds},
            {
              onSuccess: () => {
                queryClient.invalidateQueries({queryKey: ['comment']});
              },
            },
          );
        }
      }}
    >
      <Button
        variant={variant}
        size={size}
        color="danger"
        className="mr-10"
        disabled={deleteComments.isPending}
      >
        <Trans message="Delete" />
      </Button>
      <ConfirmationDialog
        isDanger
        title={
          <Trans
            message="Delete [one comment|other :count comments]"
            values={{count: commentIds.length}}
          />
        }
        body={
          commentIds.length > 1 ? (
            <Trans message="Are you sure you want to delete selected comments?" />
          ) : (
            <Trans message="Are you sure you want to delete this comment?" />
          )
        }
        confirm={<Trans message="Delete" />}
      />
    </DialogTrigger>
  );
}
