import {useImpersonateUser} from '@common/admin/users/requests/use-impersonate-user';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {Fragment} from 'react/jsx-runtime';

interface ImpersonateUserDialogProps {
  user: {id: number};
}
export function ImpersonateUserDialog({user}: ImpersonateUserDialogProps) {
  const impersonate = useImpersonateUser();
  return (
    <ConfirmationDialog
      title={<Trans message="Impersonate user" />}
      isLoading={impersonate.isPending}
      body={
        <Fragment>
          <p>
            <Trans message="Are you sure you want to login as this user?" />
          </p>
          <p className="mt-8">
            <Trans message="This will log you out of your current account and log you in as the user." />
          </p>
        </Fragment>
      }
      confirm={<Trans message="Login" />}
      onConfirm={() => {
        impersonate.mutate({userId: user.id});
      }}
    />
  );
}
