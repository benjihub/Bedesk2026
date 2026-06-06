import { Button } from '@ui/buttons/button';
import { Form } from '@ui/forms/form';
import { Trans } from '@ui/i18n/trans';
import { Dialog } from '@ui/overlays/dialog/dialog';
import { DialogBody } from '@ui/overlays/dialog/dialog-body';
import { useDialogContext } from '@ui/overlays/dialog/dialog-context';
import { DialogFooter } from '@ui/overlays/dialog/dialog-footer';
import { DialogHeader } from '@ui/overlays/dialog/dialog-header';
import { DialogTrigger } from '@ui/overlays/dialog/dialog-trigger';
import { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { FilterItemFormValue } from '../add-filter-dialog';
import { FilterListControlProps } from './filter-list-control';
import { FilterListTriggerButton } from './filter-list-trigger-button';

interface FilterListItemDialogTriggerProps extends FilterListControlProps<any> {
  label: ReactNode;
  panel: ReactNode;
}
export function FilterListItemDialogTrigger(
  props: FilterListItemDialogTriggerProps,
) {
  const {onValueChange, isInactive, filter, label} = props;
  return (
    <DialogTrigger
      offset={10}
      type="popover"
      onClose={(value?: FilterItemFormValue) => {
        if (value !== undefined) {
          onValueChange(value);
        }
      }}
    >
      <FilterListTriggerButton isInactive={isInactive} filter={filter}>
        {label}
      </FilterListTriggerButton>
      <FilterListControlDialog {...props} />
    </DialogTrigger>
  );
}

export function FilterListControlDialog({
  filter,
  panel,
  value,
  operator,
}: FilterListItemDialogTriggerProps) {
  const form = useForm<Record<string, FilterItemFormValue>>({
    defaultValues: {
      [filter.key]: {value, operator},
    },
  });
  const {close, formId} = useDialogContext();
  return (
    <Dialog size="xs">
      <DialogHeader>
        <Trans {...filter.label} />
      </DialogHeader>
      <DialogBody className="max-h-288">
        <Form
          form={form}
          id={formId}
          onSubmit={formValue => {
            close(formValue[filter.key]);
          }}
        >
          {filter.description && (
            <div className="mb-14 text-xs text-muted">
              <Trans {...filter.description} />
            </div>
          )}
          {panel}
        </Form>
      </DialogBody>
      <DialogFooter>
        <Button
          form={formId}
          type="submit"
          variant="flat"
          color="primary"
          size="xs"
        >
          <Trans message="Apply" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
