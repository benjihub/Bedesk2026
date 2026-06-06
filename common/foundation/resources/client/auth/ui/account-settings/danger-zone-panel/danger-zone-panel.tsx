import {AccountSettingsId} from '@common/auth/ui/account-settings/account-settings-sidenav';
import {usePasswordConfirmedAction} from '@common/auth/ui/confirm-password/use-password-confirmed-action';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useState} from 'react';
import {AccountSettingsPanel} from '../account-settings-panel';
import {useDeleteAccount} from './delete-account';

export function DangerZonePanel() {
  const deleteAccount = useDeleteAccount();
  const {withConfirmedPassword, isLoading: confirmingPassword} =
    usePasswordConfirmedAction();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  return (
    <AccountSettingsPanel
      id={AccountSettingsId.DeleteAccount}
      title={<Trans message="Danger zone" />}
    >
      <DialogTrigger
        type="modal"
        isOpen={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onClose={isConfirmed => {
          if (isConfirmed) {
            deleteAccount.mutate();
          }
        }}
      >
        <ConfirmationDialog
          isDanger
          title={<Trans message="Delete account?" />}
          body={
            <Trans message="Your account will be deleted immediately and permanently. Once deleted, accounts can not be restored." />
          }
          confirm={<Trans message="Delete" />}
        />
      </DialogTrigger>
      <Button
        variant="flat"
        color="danger"
        disabled={confirmingPassword || deleteAccount.isPending}
        onClick={() => {
          withConfirmedPassword(() => {
            setConfirmDialogOpen(true);
          });
        }}
      >
        <Trans message="Delete account" />
      </Button>
    </AccountSettingsPanel>
  );
}
