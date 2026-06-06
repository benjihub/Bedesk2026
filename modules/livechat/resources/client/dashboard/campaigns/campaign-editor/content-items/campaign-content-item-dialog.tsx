import {useDialogContext} from '@ui/overlays/dialog/dialog-context';
import {ReactElement} from 'react';
import {Dialog, DialogSize} from '@ui/overlays/dialog/dialog';
import {DialogHeader} from '@ui/overlays/dialog/dialog-header';
import {Trans} from '@ui/i18n/trans';
import {DialogBody} from '@ui/overlays/dialog/dialog-body';
import {DialogFooter} from '@ui/overlays/dialog/dialog-footer';
import {Button} from '@ui/buttons/button';

interface Props {
  children: [ReactElement, ReactElement];
  defaultValue: unknown;
  value: unknown;
  size?: DialogSize;
}
export function CampaignContentItemDialog({
  children,
  value,
  defaultValue,
  size = 'md',
}: Props) {
  const {close, formId} = useDialogContext();
  const [title, body] = children;
  return (
    <Dialog size={size}>
      <DialogHeader>{title}</DialogHeader>
      <DialogBody>
        <form
          id={formId}
          onSubmit={e => {
            e.preventDefault();
            close(value);
          }}
        >
          {body}
        </form>
      </DialogBody>
      <DialogFooter>
        <Button onClick={() => close()}>
          <Trans message="Cancel" />
        </Button>
        <Button type="submit" color="primary" variant="flat" form={formId}>
          {defaultValue != null ? (
            <Trans message="Update" />
          ) : (
            <Trans message="Add" />
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
