import {AttributeSelectorItemType} from '@app/attributes/attribute-selector/attribute-selector-item';
import {useAttributeSelectorItems} from '@app/attributes/attribute-selector/use-attribute-selector-items';
import {AttributeFormat} from '@app/attributes/compact-attribute';
import {DatatableAttribute} from '@app/attributes/datatable/datatable-attribute';
import {helpdeskQueries} from '@app/dashboard/helpdesk-queries';
import {apiClient, queryClient} from '@common/http/query-client';
import {showHttpErrorToast} from '@common/http/show-http-error-toast';
import {useMutation} from '@tanstack/react-query';
import {Button} from '@ui/buttons/button';
import {TextField} from '@ui/forms/input-field/text-field/text-field';
import {Item} from '@ui/forms/listbox/item';
import {Select} from '@ui/forms/select/select';
import {message} from '@ui/i18n/message';
import {Trans} from '@ui/i18n/trans';
import {EventIcon} from '@ui/icons/material/Event';
import {NumbersIcon} from '@ui/icons/material/Numbers';
import {TextFieldsIcon} from '@ui/icons/material/TextFields';
import {ToggleOnIcon} from '@ui/icons/material/ToggleOn';
import {Dialog} from '@ui/overlays/dialog/dialog';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {toast} from '@ui/toast/toast';
import {FormEvent, useState} from 'react';

export function CreateCustomAttributeDialog() {
  const {close, formId} = useDialogContext();
  const [name, setName] = useState('');
  const [format, setFormat] = useState<AttributeFormat>('text');
  const {items} = useAttributeSelectorItems();

  const createAttribute = useCreateField();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (items.some(item => item.name === name)) {
      toast.danger(message('This name is already in use'));
      return;
    }

    createAttribute.mutate(
      {
        name,
        format,
        type: AttributeSelectorItemType.AiAgentSession,
        permission: 'userCanView',
      },
      {
        onSuccess: () => {
          close({
            name,
            type: AttributeSelectorItemType.AiAgentSession,
          });
        },
      },
    );
  };

  return (
    <Dialog>
      <DialogHeader>
        <Trans message="Create custom attribute" />
      </DialogHeader>
      <DialogBody>
        <form id={formId} onSubmit={handleSubmit}>
          <TextField
            autoFocus
            required
            label={<Trans message="Name" />}
            value={name}
            onChange={e => setName(e.target.value)}
            className="mb-20"
          />
          <Select
            selectionMode="single"
            name="format"
            className="mb-20"
            label={<Trans message="Format" />}
            selectedValue={format}
            onSelectionChange={value => setFormat(value as AttributeFormat)}
          >
            <Item value="text" startIcon={<TextFieldsIcon size="sm" />}>
              <Trans message="Text" />
            </Item>
            <Item value="switch" startIcon={<ToggleOnIcon size="sm" />}>
              <Trans message="Toggle" />
            </Item>
            <Item value="number" startIcon={<NumbersIcon size="sm" />}>
              <Trans message="Number" />
            </Item>
            <Item value="date" startIcon={<EventIcon size="sm" />}>
              <Trans message="Date" />
            </Item>
          </Select>
        </form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button
          variant="flat"
          color="primary"
          type="submit"
          form={formId}
          disabled={createAttribute.isPending}
        >
          <Trans message="Create" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function useCreateField() {
  return useMutation({
    mutationFn: (payload: Partial<DatatableAttribute>) =>
      apiClient.post('helpdesk/attributes', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: helpdeskQueries.attributes.invalidateKey,
      });
    },
    onError: r => showHttpErrorToast(r),
  });
}
