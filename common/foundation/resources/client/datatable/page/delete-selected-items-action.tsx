import {errorStatusIs} from '@common/http/error-status-is';
import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {useDeleteSelectedRows} from '../requests/delete-selected-rows';
import {useDataTable} from './data-table-context';

export function DeleteSelectedItemsAction() {
  return (
    <DialogTrigger type="modal">
      <Button variant="flat" color="danger" className="ml-auto">
        <Trans message="Delete" />
      </Button>
      <DeleteItemsDialog />
    </DialogTrigger>
  );
}

function DeleteItemsDialog() {
  const deleteSelectedRows = useDeleteSelectedRows();
  const {selectedRows, setSelectedRows} = useDataTable();
  const {close} = useDialogContext();
  return (
    <ConfirmationDialog
      isLoading={deleteSelectedRows.isPending}
      title={
        <Trans
          message="Delete [one 1 item|other :count items]?"
          values={{count: selectedRows.length}}
        />
      }
      body={
        <Trans message="This will permanently remove the items and cannot be undone." />
      }
      confirm={<Trans message="Delete" />}
      isDanger
      onConfirm={() => {
        deleteSelectedRows.mutate(undefined, {
          onSuccess: () => close(),
          onError: err => {
            if (errorStatusIs(err, 422)) {
              setSelectedRows([]);
              close();
            }
          },
        });
      }}
    />
  );
}
