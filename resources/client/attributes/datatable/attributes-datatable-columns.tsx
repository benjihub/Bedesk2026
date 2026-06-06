import {useUpdateAttribute} from '@app/attributes/crupdate/use-update-attribute';
import {PrettyAttributeType} from '@app/attributes/rendering/pretty-attribute-type';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {ColumnConfig} from '@common/datatable/column-config';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {IconButton} from '@ui/buttons/icon-button';
import {FormattedDate} from '@ui/i18n/formatted-date';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {CheckIcon} from '@ui/icons/material/Check';
import {CloseIcon} from '@ui/icons/material/Close';
import {MoreVertIcon} from '@ui/icons/material/MoreVert';
import {Menu, MenuItem, MenuTrigger} from '@ui/menu/menu-trigger';
import {ConfirmationDialog} from '@ui/overlays/dialog/confirmation-dialog';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogTrigger} from '@ui/overlays/dialog/dialog-trigger';
import {toast} from '@ui/toast/toast';
import {Fragment, useState} from 'react';
import {Link} from 'react-router';
import {DatatableAttribute} from './datatable-attribute';

export const AttributesDatatableColumns: ColumnConfig<DatatableAttribute>[] = [
  {
    key: 'name',
    visibleInMode: 'all',
    header: () => <Trans message="Name" />,
    body: attribute => <span className="text-primary">{attribute.name}</span>,
  },
  {
    key: 'type',
    header: () => <Trans message="Type" />,
    body: attribute => <PrettyAttributeType type={attribute.type} />,
  },
  {
    key: 'format',
    header: () => <Trans message="Format" />,
    body: attribute => <PrettyFormat format={attribute.format} />,
  },
  {
    key: 'active',
    header: () => <Trans message="Active" />,
    body: attribute =>
      attribute.active ? (
        <CheckIcon className="text-muted" />
      ) : (
        <CloseIcon className="text-muted" />
      ),
  },
  {
    key: 'updated_at',
    header: () => <Trans message="Last updated" />,
    body: attribute => <FormattedDate date={attribute.updated_at} />,
  },
  {
    key: 'actions',
    hideHeader: true,
    align: 'end',
    visibleInMode: 'all',
    header: () => <Trans message="Actions" />,
    body: attribute => <ActionsButton attribute={attribute} />,
    width: 'w-44 flex-shrink-0',
  },
];

interface ActionsButtonProps {
  attribute: DatatableAttribute;
}
export function ActionsButton({attribute}: ActionsButtonProps) {
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);
  const updateAttribute = useUpdateAttribute(attribute.id);

  const activateAttribute = () =>
    updateAttribute.mutate(
      {active: true},
      {onSuccess: () => toast(message('Activated attribute'))},
    );

  const deactivateAttribute = () =>
    updateAttribute.mutate(
      {active: false},
      {onSuccess: () => toast(message('Deactivated attribute'))},
    );

  return (
    <Fragment>
      {deleteDialogIsOpen && (
        <DialogTrigger
          type="modal"
          isOpen={deleteDialogIsOpen}
          onOpenChange={setDeleteDialogIsOpen}
        >
          <DeleteAttributeDialog attributeId={attribute.id} />
        </DialogTrigger>
      )}
      <MenuTrigger>
        <IconButton className="text-muted" disabled={updateAttribute.isPending}>
          <MoreVertIcon />
        </IconButton>
        <Menu>
          <MenuItem value="edit" elementType={Link} to={`${attribute.id}/edit`}>
            <Trans message="Edit" />
          </MenuItem>
          {!attribute.active && (
            <MenuItem value="activate" onSelected={() => activateAttribute()}>
              <Trans message="Activate" />
            </MenuItem>
          )}
          {attribute.active && (
            <MenuItem
              value="deactivate"
              onSelected={() => deactivateAttribute()}
              isDisabled={attribute.key === 'name' || attribute.key === 'email'}
            >
              <Trans message="Deactivate" />
            </MenuItem>
          )}
          <MenuItem
            value="delete"
            className="text-danger"
            onSelected={() => setDeleteDialogIsOpen(true)}
            isDisabled={attribute.internal}
          >
            <Trans message="Delete" />
          </MenuItem>
        </Menu>
      </MenuTrigger>
    </Fragment>
  );
}

interface PrettyFormatProps {
  format: string;
}
function PrettyFormat({format}: PrettyFormatProps) {
  format = format.replace(/([A-Z])/g, ' $1');
  return <span className="capitalize">{format}</span>;
}

interface DeleteAttributeDialogProps {
  attributeId: number;
}
export function DeleteAttributeDialog({
  attributeId,
}: DeleteAttributeDialogProps) {
  const deleteAttribute = useDeleteAttribute();
  const {close} = useDialogContext();
  return (
    <ConfirmationDialog
      isLoading={deleteAttribute.isPending}
      title={<Trans message="Delete this attribute?" />}
      body={
        <Trans message="This will permanently remove the attribute and cannot be undone." />
      }
      confirm={<Trans message="Delete" />}
      isDanger
      onConfirm={() => {
        deleteAttribute.mutate(
          {attributeId},
          {
            onSuccess: () => close(),
          },
        );
      }}
    />
  );
}

function useDeleteAttribute() {
  return useMutation({
    mutationFn: ({attributeId}: {attributeId: number}) =>
      apiClient.delete(`helpdesk/attributes/${attributeId}`).then(r => r.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: helpdeskQueries.attributes.invalidateKey,
      });
      toast(message('Deleted custom attribute'));
    },
    onError: err =>
      showHttpErrorToast(err, message('Could not delete custom attribute')),
  });
}
