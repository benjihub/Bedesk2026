import {Button} from '@ui/buttons/button';
import {Trans} from '@ui/i18n/trans';
import {ErrorOutlineIcon} from '@ui/icons/material/ErrorOutline';
import {ReactNode} from 'react';
import {Dialog} from './dialog';
import {DialogBody} from './dialog-body';
import {useDialogContext} from './dialog-context';
import {DialogFooter} from './dialog-footer';
import {DialogHeader} from './dialog-header';

interface Props {
  className?: string;
  title: ReactNode;
  body: ReactNode;
  close?: ReactNode;
  hideClose?: boolean;
  confirm: ReactNode;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm?: () => void;
}
export function ConfirmationDialog({
  className,
  title,
  body,
  close: closeText,
  hideClose,
  confirm,
  isDanger,
  isLoading,
  onConfirm,
}: Props) {
  const {close} = useDialogContext();
  return (
    <Dialog className={className} role="alertdialog">
      <DialogHeader
        color={isDanger ? 'text-danger' : null}
        leftAdornment={<ErrorOutlineIcon className="icon-sm" />}
      >
        {title}
      </DialogHeader>
      <DialogBody>{body}</DialogBody>
      <DialogFooter>
        {!hideClose && (
          <Button
            variant="text"
            onClick={() => {
              close(false);
            }}
          >
            {closeText || <Trans message="Cancel" />}
          </Button>
        )}
        <Button
          disabled={isLoading}
          variant="flat"
          color={isDanger ? 'danger' : 'primary'}
          onClick={() => {
            onConfirm?.();
            // if callback is passed in, caller is responsible for closing the dialog
            if (!onConfirm) {
              close(true);
            }
          }}
        >
          {confirm}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
