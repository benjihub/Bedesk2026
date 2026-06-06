import {CustomDomain} from '@common/custom-domains/custom-domain';
import {useDeleteDomain} from '@common/custom-domains/datatable/requests/use-delete-domain';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';

interface DeleteDomainButtonProps {
  domain: CustomDomain;
}
export function DeleteDomainButton({domain}: DeleteDomainButtonProps) {
  const deleteDomain = useDeleteDomain();

  return (
    <DialogTrigger
      type="modal"
      onClose={isConfirmed => {
        if (isConfirmed) {
          deleteDomain.mutate({domain});
        }
      }}
    >
      <Button
        variant="outline"
        color="danger"
        size="xs"
        disabled={deleteDomain.isPending}
      >
        <Trans message="Remove" />
      </Button>
      <ConfirmationDialog
        title={<Trans message="Remove domain?" />}
        body={
          <Trans
            message="Are you sure you want to remove “:domain“?"
            values={{domain: domain.host}}
          />
        }
        confirm={<Trans message="Remove" />}
        isDanger
      />
    </DialogTrigger>
  );
}
